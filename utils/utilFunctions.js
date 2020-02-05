// This function return color according the defect type.
const getColor = type => {
  switch (type) {
    case 'P':
      return '#71df38';
    case 'PN':
      return '#519ff0';
    case 'PS':
      return '#1c4dca';
    case 'SD':
      return '#9539e2';
    case 'C':
      return '#0e3f0a';
    case 'D':
      return '#b22222';
    case 'B':
      return '#f18027';
    case 'RD':
      return '#f85210';
    default:
      return '#000';
  }
};

// This function convert timeStamp data into formatted date and time.
const timeToString = timeStampData => {
  const current_datetime = new Date(timeStampData);
  const timeString =
    current_datetime.getFullYear() +
    '-' +
    ('0' + (current_datetime.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + current_datetime.getDate()).slice(-2) +
    ' ' +
    ('0' + current_datetime.getHours()).slice(-2) +
    ':' +
    ('0' + current_datetime.getMinutes()).slice(-2) +
    ':' +
    ('0' + current_datetime.getSeconds()).slice(-2);

  return timeString;
};

// This function convert video to blob in callback according to the local uri.
const uriToBlob = uri => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function() {
      reject(new Error('uriToBlob failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

// Geocoder.from(geoResult.coords.latitude, geoResult.coords.longitude)
//   .then(json => {
//     const geoAddress =
//       json.results[0].address_components[0].long_name +
//       ' ' +
//       json.results[0].address_components[1].short_name +
//       ' ' +
//       json.results[0].address_components[2].short_name +
//       ' ' +
//       json.results[0].address_components[3].short_name; // +' ' +json.results[0].address_components[7].short_name;
//     this.setState({
//       geoData: geoResult.coords,
//       timestamp: geoResult.timestamp,
//       timeString: timeString,
//       address: geoAddress,
//     });
//   })
//   .catch(error => console.warn(error));

export {getColor, timeToString, uriToBlob};
