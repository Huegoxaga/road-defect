## Change Log

### 1.4.4

- Added a background timer for session_id.
- Updated the uploading completion time for the image data.
- Added a filter that only fetch data points taken by the current device for both map and upload screen.

### 1.4.3

- Fixed bugs that caused by updating sensor data after MapScreen is unmounted.
- Deleted filter for type 'A' when type property is removed.

### 1.4.2

- Added external media folder '/IrisMedia' for photos taken by android.
- Move all photos taken by the iPhone to the IrisMedia Album of the CameraRoll for testing purposes.

### 1.4.1

- Minor fixes on the upload task counter.

### 1.4

- Improved concurrent upload method(20 photos at a time) which is capable of uploading large amounts of photos with low internet bandwidth.
- Added the ability to cancel and resume upload.
- Added a new file system and created a permanent documents folder within the app folder.
  - Moved the photo from the cache to the document folder whenever the photo is taken.
  - Deleted the photo whenever it has been uploaded.
- Registered onCameraReady Event handler and conditional controls for Android camera.
- Added Exception handling for errors during uploading when the internet connection is lost.
- Simplified sensor methods and upload one set of x, y, z at a time.
- Updated JSON data structure.

### 1.1.4

- Deleted group upload method for demo.

### 1.3

- Added React Native Sensor
- Added a listener that gets z data of the accelerator every 400ms, stores and uploads max and min.
- Added group upload method.

### 1.2

- Initial Commit
