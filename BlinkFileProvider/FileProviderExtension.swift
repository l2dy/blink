//////////////////////////////////////////////////////////////////////////////////
//
// B L I N K
//
// Copyright (C) 2016-2019 Blink Mobile Shell Project
//
// This file is part of Blink.
//
// Blink is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Blink is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Blink. If not, see <http://www.gnu.org/licenses/>.
//
// In addition, Blink is also subject to certain additional terms under
// GNU GPL version 3 section 7.
//
// You should have received a copy of these additional terms immediately
// following the terms and conditions of the GNU General Public License
// which accompanied the Blink Source Code. If not, see
// <http://www.github.com/blinksh/blink>.
//
////////////////////////////////////////////////////////////////////////////////


import Combine
import FileProvider

import BlinkFiles
import BlinkConfig

// TODO Provide proper error subclassing. BlinkFilesProviderError
extension String: Error {}


class FileProviderExtension: NSFileProviderExtension {

  var fileManager = FileManager()
  var cache = FileTranslatorCache()
  var cancellableBag: Set<AnyCancellable> = []
  let copyArguments = CopyArguments(inplace: true,
                                    preserve: [.permissions, .timestamp],
                                    checkTimes: true)
  override init() {
    super.init()

    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "MMM dd YYYY, HH:mm:ss"

    BlinkLogging.handle(
      {
        $0.filter(logLevel: .debug)
          .format { [ $0[.component] as? String ?? "global",
                      $0[.message] as? String ?? ""
                    ].joined(separator: " ") }
          .sinkToOutput()
      }
    )

    guard let file = try? FileLogging(to: BlinkPaths.fileProviderErrorLogURL()) else {
      print("File logging not configured")
      return
    }
    // Configure logging so all goes to file (filtered by error level) and output.
    BlinkLogging.handle(
      {
        try $0.filter(logLevel: .debug)
        // Format
          .format { [ dateFormatter.string(from: Date()),
                      $0[.component] as? String ?? "global",
                      "[\($0[.logLevel]!)]",
                      $0[.message] as? String ?? ""
                    ].joined(separator: " ") }
          .sinkToFile(file)
      }
    )
  }

  // MARK: - BlinkItem Entry : DB-GET query (using uniq NSFileProviderItemIdentifier ID)
  override func item(for identifier: NSFileProviderItemIdentifier) throws -> NSFileProviderItem {
    let log = BlinkLogger("itemFor")
    log.info("\(identifier)")

    var queryableIdentifier: BlinkItemIdentifier!

    if identifier == .rootContainer {
      guard let encodedRootPath = domain?.pathRelativeToDocumentStorage else {
        let error = NSFileProviderError(.noSuchItem)
        log.error("\(error)")
        throw error
      }
      queryableIdentifier = BlinkItemIdentifier(encodedRootPath)
    } else {
      queryableIdentifier = BlinkItemIdentifier(identifier)
    }

    guard let reference = self.cache.reference(identifier: queryableIdentifier) else {
      if identifier == .rootContainer {
        let attributes = try? fileManager.attributesOfItem(atPath: queryableIdentifier.url.path)
        return BlinkItemReference(queryableIdentifier, local: attributes, cache: self.cache)
      }
      log.error("No reference found for ITEM \(queryableIdentifier.path)")
      throw NSError.fileProviderErrorForNonExistentItem(withIdentifier: identifier)
    }

    return reference
  }

  override func urlForItem(withPersistentIdentifier identifier: NSFileProviderItemIdentifier) -> URL? {
    let blinkItemFromId = BlinkItemIdentifier(identifier)
    BlinkLogger("urlForItem").debug("\(blinkItemFromId.itemIdentifier)")
    return blinkItemFromId.url
  }

  // MARK: - Actions

  override func persistentIdentifierForItem(at url: URL) -> NSFileProviderItemIdentifier? {
    BlinkLogger("persistentIdentifierForItem").debug("\(url.path)")
    guard let ref = self.cache.reference(url: url) else {
      return nil
    }
    return ref.itemIdentifier
  }

  override func providePlaceholder(at url: URL, completionHandler: @escaping (Error?) -> Void) {
    let log = BlinkLogger("providePlaceHolder")
    log.info("\(url.path)")

    //A.1. Get the document’s persistent identifier by calling persistentIdentifierForItemAtURL:, and pass in the value of the url parameter.
    let localDirectory = url.deletingLastPathComponent()

    do {
      try fileManager.createDirectory(
        at: localDirectory,
        withIntermediateDirectories: true,
        attributes: nil
      )
    } catch {
      log.error("\(error)")
      completionHandler(error)
      return
    }

    //A Look Up the Document's File Provider Item
    guard let identifier = persistentIdentifierForItem(at: url) else {
      completionHandler(NSFileProviderError(.noSuchItem))
      return
    }
    log.debug("identifier \(identifier)")

    do {

      //A.2. Call itemForIdentifier:error:, and pass in the persistent identifier. This method returns the file provider item for the document.
      let fileProviderItem = try item(for: identifier)

      // B. Write the Placeholder
      // B.1 Get the placeholder URL by calling placeholderURLForURL:, and pass in the value of the url parameter.
      let placeholderURL = NSFileProviderManager.placeholderURL(for: url)

      // B.2 Call writePlaceholderAtURL:withMetadata:error:, and pass in the placeholder URL and the file provider item.
      try NSFileProviderManager.writePlaceholder(at: placeholderURL,withMetadata: fileProviderItem)

      completionHandler(nil)

    } catch let error {
      log.error("\(error)")
      completionHandler(error)
      return
    }
  }

  override func startProvidingItem(at url: URL, completionHandler: @escaping ((_ error: Error?) -> Void)) {
    // 1 - From URL we get the identifier.
    let log = BlinkLogger("startProvidingItem")
    log.info("\(url)")

    //let blinkIdentifier = BlinkItemIdentifier(url: url)
    guard let blinkItemReference = self.cache.reference(url: url) else {
    //guard let blinkItemReference = FileTranslatorCache.reference(identifier: blinkIdentifier) else {
      // TODO Proper error types (NSError)
      log.error("No reference found")
      completionHandler(NSFileProviderError(.noSuchItem))
      return
    }

    guard !blinkItemReference.isDownloaded else {
      log.info("\(blinkItemReference.path) - current item up to date")
      completionHandler(nil)
      return
    }

    // 2 local translator
    let destTranslator = Local().cloneWalkTo(url.deletingLastPathComponent().path)

    // 3 remote - From the identifier, we get the translator and walk to the remote.
    let srcTranslator = self.cache.rootTranslator(for: BlinkItemIdentifier(blinkItemReference.itemIdentifier))
    let downloadTask = srcTranslator.flatMap {
      $0.cloneWalkTo(blinkItemReference.path)
    }
      .flatMap { fileTranslator in
        // 4 - Start the copy
        return destTranslator.flatMap { $0.copy(from: [fileTranslator],
                                                args: self.copyArguments) }
      }
      .sink(receiveCompletion: { completion in
        switch completion {
        case .finished:
          log.info("\(blinkItemReference.path) - completed")
          blinkItemReference.downloadCompleted(nil)
          completionHandler(nil)
          self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
        case .failure(let error):
          log.error("\(error)")
          completionHandler(NSFileProviderError.operationError(dueTo: error))
          self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
        }
      }, receiveValue: { _ in })

    blinkItemReference.downloadStarted(downloadTask)
    self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
  }

  override func stopProvidingItem(at url: URL) {
    let log = BlinkLogger("stopProvidingItem")
    log.info("\(url.path)")
    // Called after the last claim to the file has been released. At this point, it is safe for the file provider to remove the content file.
    // Care should be taken that the corresponding placeholder file stays behind after the content file has been deleted.

    // Called after the last claim to the file has been released. At this point, it is safe for the file provider to remove the content file.

    // TODO: look up whether the file has local changes
    let fileHasLocalChanges = false

    if !fileHasLocalChanges {
      // remove the existing file to free up space
      do {
        _ = try FileManager.default.removeItem(at: url)
      } catch {
        // Handle error
        log.error("\(error)")
      }

      // write out a placeholder to facilitate future property lookups
      self.providePlaceholder(at: url, completionHandler: { error in
        // TODO The placeholder will take into account the file, but we will need to make sure
        // that the Reference know that the local file is actually empty.
        // This means if mtime is a reference, the size should be too, in order to differentiate
        // files we already have from those that need to be downloaded.
        // TODO: handle any error, do any necessary cleanup
      })
    }
  }

  override func importDocument(at fileURL: URL, toParentItemIdentifier parentItemIdentifier: NSFileProviderItemIdentifier, completionHandler: @escaping (NSFileProviderItem?, Error?) -> Void) {
    let log = BlinkLogger("importDocument")
    print("importDocument at \(fileURL.path)")

    let parentBlinkIdentifier: BlinkItemIdentifier!
    if parentItemIdentifier == .rootContainer {
      parentBlinkIdentifier = BlinkItemIdentifier(domain!.pathRelativeToDocumentStorage)
    } else {
      parentBlinkIdentifier = BlinkItemIdentifier(parentItemIdentifier)
    }

    let fileBlinkIdentifier = BlinkItemIdentifier(parentItemIdentifier: parentBlinkIdentifier, filename: fileURL.lastPathComponent)
    let localFileURLDirectory = fileBlinkIdentifier.url.deletingLastPathComponent().path

    var attributes: FileAttributes!
    do {
      attributes = try fileManager.attributesOfItem(atPath: fileURL.path)
      attributes[.name] = fileBlinkIdentifier.url.lastPathComponent
    } catch {
      log.error("Could not fetch attributes of item - \(error)")
      completionHandler(nil, NSFileProviderError.operationError(dueTo: error))
      return
    }

    // Copy only Regular files, do not support directories yet.
    if attributes[.type] as! FileAttributeType != .typeRegular {
      log.error("Directories not supported for this operation")
      completionHandler(nil, NSFileProviderError(.noSuchItem))
      return
    }

    // Move file to the provider container.
    do {
      try moveFile(fileURL, to: localFileURLDirectory)
    } catch {
      log.error("File could not be moved to container - \(error)")
      completionHandler(nil, error)
    }

    let blinkItemReference = BlinkItemReference(fileBlinkIdentifier, local: attributes, cache: self.cache)
    self.cache.store(reference: blinkItemReference)

    // 1. Translator for local target path
    let localFileURLPath = fileBlinkIdentifier.url.path
    let srcTranslator = Local().cloneWalkTo(localFileURLPath)

    // 2. translator for remote target path
    let destTranslator = self.cache.rootTranslator(for: parentBlinkIdentifier)
      .flatMap { $0.cloneWalkTo(parentBlinkIdentifier.path) }

    let c = destTranslator.flatMap { remotePathTranslator in
        return srcTranslator.flatMap{ localFileTranslator -> CopyProgressInfoPublisher in
          // 3. Start copy
          return remotePathTranslator.copy(from: [localFileTranslator],
                                           args: self.copyArguments)
        }
      }.sink { completion in
        // 4. Update reference and notify
        if case let .failure(error) = completion {
          log.error("Upload failed \(localFileURLPath)- \(error)")
          blinkItemReference.uploadCompleted(error)
          completionHandler(blinkItemReference,
                            NSFileProviderError.operationError(dueTo: error))
          self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
          return
        }

        blinkItemReference.uploadCompleted(nil)
        log.info("Upload completed \(localFileURLPath)")
        completionHandler(blinkItemReference, nil)
        self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
      } receiveValue: { _ in }

    blinkItemReference.uploadStarted(c)
    self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
  }

  override func itemChanged(at url: URL) {
    // Called at some point after the file has changed; the provider may then trigger an upload
    let log = BlinkLogger("itemChanged")
    log.info("\(url.path)")

    guard var blinkItemReference = self.cache.reference(url: url) else {
      log.error("Could not find reference to item")
      return
    }
    // - if there are existing NSURLSessionTasks uploading this file, cancel them
    // Cancel an upload if there is a reference to it.
    blinkItemReference.uploadingTask?.cancel()

    // - mark file at <url> as needing an update in the model
    // Update the model
    var attributes: FileAttributes!
    do {
      attributes = try fileManager.attributesOfItem(atPath: url.path)
      attributes[.name] = url.lastPathComponent
    } catch {
      log.error("Could not fetch attributes of item - \(error)")
      return
    }
    // Replace the reference to the local
    blinkItemReference = BlinkItemReference(BlinkItemIdentifier(blinkItemReference.itemIdentifier),
                                            local: attributes,
                                            cache: self.cache)
    self.cache.store(reference: blinkItemReference)


    // - create a fresh background NSURLSessionTask and schedule it to upload the current modifications
    // 1. Translator for local target path
    let localFileURLPath = url.path
    let srcTranslator = Local().cloneWalkTo(localFileURLPath)

    // 2. Translator for remote file path
    let itemIdentifier = blinkItemReference.itemIdentifier
    let destTranslator = self.cache.rootTranslator(for: BlinkItemIdentifier(itemIdentifier))
      .flatMap { $0.cloneWalkTo(BlinkItemIdentifier(blinkItemReference.parentItemIdentifier).path) }

    // 3. Upload
    let c = destTranslator.flatMap { remotePathTranslator in
        return srcTranslator.flatMap{ localFileTranslator -> CopyProgressInfoPublisher in
          // 3. Start copy
          return remotePathTranslator.copy(from: [localFileTranslator],
                                           args: self.copyArguments)
        }
      }.sink { completion in
        // 4. Update reference and notify
        if case let .failure(error) = completion {
          log.error("Upload failed \(localFileURLPath)- \(error)")
          blinkItemReference.uploadCompleted(error)

          self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
          return
        }

        blinkItemReference.uploadCompleted(nil)
        self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)

        log.info("Upload completed \(localFileURLPath)")
      } receiveValue: { _ in }

    blinkItemReference.uploadStarted(c)

    self.signalEnumerator(for: blinkItemReference.parentItemIdentifier)
  }

  override func createDirectory(withName directoryName: String,
                                inParentItemIdentifier parentItemIdentifier: NSFileProviderItemIdentifier,
                                completionHandler: @escaping (NSFileProviderItem?, Error?) -> Void) {
    let log = BlinkLogger("createDirectory")
    log.info("\(directoryName) at \(parentItemIdentifier.rawValue)")

    let parentBlinkIdentifier: BlinkItemIdentifier!
    if parentItemIdentifier == .rootContainer {
      parentBlinkIdentifier = BlinkItemIdentifier(domain!.pathRelativeToDocumentStorage)
    } else {
      parentBlinkIdentifier = BlinkItemIdentifier(parentItemIdentifier)
    }

    let translator = self.cache.rootTranslator(for: parentBlinkIdentifier)

    var directoryBlinkIdentifier = BlinkItemIdentifier(parentItemIdentifier: parentBlinkIdentifier, filename: directoryName)

    translator
      .flatMap {
        $0.cloneWalkTo(parentBlinkIdentifier.path)
      }
      .flatMap { t -> AnyPublisher<Translator, Error> in
        var tries = 1
        while (self.cache.reference(identifier: directoryBlinkIdentifier) != nil) {
          tries += 1

          directoryBlinkIdentifier = BlinkItemIdentifier(parentItemIdentifier: parentBlinkIdentifier,
                                                         filename: "\(directoryName) \(tries)")
        }

        return t.mkdir(name: directoryBlinkIdentifier.filename,
                       mode: S_IRWXU | S_IRWXG | S_IRWXO)
          .eraseToAnyPublisher()
      }
      .flatMap {
        $0.stat()
      }
      .sink(
        receiveCompletion: { completion in
          if case let .failure(error) = completion {
            log.error("\(error)")
            completionHandler(nil, NSFileProviderError.operationError(dueTo: error))
          }
        },
        receiveValue: { attrs in
          let ref = BlinkItemReference(directoryBlinkIdentifier, remote: attrs, cache: self.cache)
          self.cache.store(reference: ref)
          completionHandler(ref, nil)
        }
      ).store(in: &cancellableBag)
  }

  override func renameItem(withIdentifier itemIdentifier: NSFileProviderItemIdentifier, toName itemName: String, completionHandler: @escaping (NSFileProviderItem?, Error?) -> Void) {
    let log = BlinkLogger("renameItem")
    log.info("\(itemIdentifier) as \(itemName)")

    let blinkItemIdentifier = BlinkItemIdentifier(itemIdentifier)
    guard let blinkItemReference = self.cache.reference(identifier: blinkItemIdentifier) else {
      completionHandler(nil, NSFileProviderError(.noSuchItem))
      return
    }
    let parentItemIdentifier = BlinkItemIdentifier(blinkItemIdentifier.parentIdentifier)

    let newItemIdentifier = BlinkItemIdentifier(parentItemIdentifier: parentItemIdentifier,
                                                filename: itemName)

    if let _ = self.cache.reference(identifier: newItemIdentifier) {
      completionHandler(nil, NSFileProviderError(.filenameCollision))
      return
    }

    self.cache.rootTranslator(for: blinkItemIdentifier)
      .flatMap { t in
        t.cloneWalkTo(blinkItemIdentifier.path)
         .flatMap { $0.wstat([.name: itemName]) }
         .map { _ in t }
      }
      .flatMap { $0.cloneWalkTo(newItemIdentifier.path) }
      .flatMap { $0.stat() }
      .sink(
        receiveCompletion: { completion in
          if case let .failure(error) = completion {
            log.error("\(error)")
            completionHandler(nil, NSFileProviderError.operationError(dueTo: error))
          }
        },
        receiveValue: { attrs in
          self.cache.remove(reference: blinkItemReference)
          let newBlinkItemReference = BlinkItemReference(newItemIdentifier, remote: attrs, cache: self.cache)
          self.cache.store(reference: newBlinkItemReference)
          completionHandler(newBlinkItemReference, nil)
        }
      ).store(in: &cancellableBag)
  }

  override func deleteItem(withIdentifier itemIdentifier: NSFileProviderItemIdentifier, completionHandler: @escaping (Error?) -> Void) {
    let log = BlinkLogger("deleteItem")
    log.info("\(itemIdentifier)")

    let blinkItemIdentifier = BlinkItemIdentifier(itemIdentifier)
    guard let blinkItemReference = self.cache.reference(identifier: blinkItemIdentifier) else {
      completionHandler(NSFileProviderError(.noSuchItem))
      return
    }

    let recursive = true

    func delete(_ translators: [Translator]) -> AnyPublisher<Void, Error> {
      translators.publisher
        .flatMap(maxPublishers: .max(1)) { t -> AnyPublisher<Void, Error> in
          print(t.current)
          if t.fileType == .typeDirectory {
            return [deleteDirectoryContent(t), AnyPublisher(t.rmdir().map {_ in})]
              .compactMap { $0 }
              .publisher
              .flatMap(maxPublishers: .max(1)) { $0 }
              .collect()
              .map {_ in}
              .eraseToAnyPublisher()
          }

          return AnyPublisher(t.remove().map { _ in })
        }.eraseToAnyPublisher()
    }

    func deleteDirectoryContent(_ t: Translator) -> AnyPublisher<Void, Error>? {
      if recursive == false {
        return nil
      }

      return t.directoryFilesAndAttributes().flatMap {
        $0.compactMap { i -> FileAttributes? in
          if (i[.name] as! String) == "." || (i[.name] as! String) == ".." {
            return nil
          } else {
            return i
          }
        }.publisher
      }
      .flatMap {
        t.cloneWalkTo($0[.name] as! String) }
      .collect()
      .flatMap {
        delete($0) }
      .eraseToAnyPublisher()
    }

    self.cache.rootTranslator(for: blinkItemIdentifier)
      .flatMap {
        $0.cloneWalkTo(blinkItemIdentifier.path)
          .flatMap { delete([$0]) }
      }
      .sink(
        receiveCompletion: { completion in
          if case let .failure(error) = completion {
            log.error("\(error)")
            completionHandler(NSFileProviderError.operationError(dueTo: error))
          } else {
            // NOTE We may want to delete the other references as well. But as this is an in-memory cache,
            // just deleting the parent reference should be enough.
            self.cache.remove(reference: blinkItemReference)
            _ = try? FileManager.default.removeItem(at: blinkItemReference.url)
            completionHandler(nil)
          }
        },
        receiveValue: { _ in }
      ).store(in: &cancellableBag)
  }

  // MARK: - Enumeration

  override func enumerator(for containerItemIdentifier: NSFileProviderItemIdentifier) throws -> NSFileProviderEnumerator {
    let log = BlinkLogger("enumerator")
    log.info("\(containerItemIdentifier.rawValue)")

    guard let domain = self.domain else {
      log.error("No domain provided")
      throw NSFileProviderError.noDomainProvided
    }

    if (containerItemIdentifier != NSFileProviderItemIdentifier.workingSet) {
      return FileProviderEnumerator(enumeratedItemIdentifier: containerItemIdentifier, domain: domain, cache: self.cache)
    } else {
      // We may want to do an empty FileProviderEnumerator, because otherwise it will try to request it again and again.
      throw NSError(domain: NSCocoaErrorDomain, code: NSFeatureUnsupportedError, userInfo:[:])
    }
  }

  // MARK: - Private
  private func moveFile(_ fileURL: URL, to targetPath: String) throws {
    _ = fileURL.startAccessingSecurityScopedResource()

    var isDirectory: ObjCBool = false
    var coordinatorError: NSError? = nil
    var error: NSError? = nil
    NSFileCoordinator()
      .coordinate(readingItemAt: fileURL, options: .withoutChanges, error: &coordinatorError) { url in
        do {
          if !fileManager.fileExists(atPath: targetPath, isDirectory:&isDirectory) {
            try fileManager.createDirectory(atPath: targetPath, withIntermediateDirectories: true, attributes: nil)
        // Check to see if file exists, move file, error handling
          }

          let filename = fileURL.lastPathComponent
          let newFilePath  = (targetPath as NSString).appendingPathComponent(filename)
          if fileManager.fileExists(atPath: newFilePath) {
            try fileManager.removeItem(atPath: newFilePath)
          }

          try fileManager.moveItem(atPath: fileURL.path, toPath: newFilePath)
        } catch let err {
          error = err as NSError
        }
      }

    fileURL.stopAccessingSecurityScopedResource()

    if let error = (error != nil) ? error : coordinatorError {
      throw error
    }
  }

  private func signalEnumerator(for container: NSFileProviderItemIdentifier) {
    guard let domain = self.domain,
      let fpm = NSFileProviderManager(for: domain) else {
      return
    }

    fpm.signalEnumerator(for: container, completionHandler: { error in
      BlinkLogger("signalEnumerator").info("Enumerator Signaled with \(error ?? "no error")")
    })
  }

  deinit {
    print("OOOOUUUTTTTT!!!!!")
  }
}
