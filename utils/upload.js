import Upload from 'react-native-background-upload';

export function bindUploadListener() {
  Upload.addListener('progress', data => {
    console.log(`Progress: ${data.progress}%`);
  });
  Upload.addListener('error', data => {
    console.log(`Error: ${data.error}%`);
  });
  Upload.addListener('cancelled', data => {
    console.log(`Cancelled!`);
  });
  Upload.addListener('completed', data => {
    // data includes responseCode: number and responseBody: Object
    console.log('Completed!');
  });
}

export default uploader = currentPath => {
  const options = {
    url: 'https://driveuploader.com/upload/g8IAJiu87A/',
    path: currentPath,
    method: 'POST',
    field: 'uploaded_media',
    type: 'multipart',
    headers: {
      'content-type': 'application/octet-stream', // Customize content-type
    },
    // Below are options only supported on Android
    notification: {
      enabled: true,
    },
  };

  Upload.startUpload(options)
    .then(uploadId => {
      console.log('Upload started', uploadId);
    })
    .catch(err => {
      console.log('Upload error!', err);
    });
};
