import React, {Component} from 'react';
import {RNCamera} from 'react-native-camera';
import Tts from 'react-native-tts';
import {database, storage} from '../utils/firebase';
import cityBoundary, {testRoads} from '../utils/hamilton';
import MapView, {Geojson, Polyline, Marker} from 'react-native-maps';
import mapStyle from '../utils/mapStyles.json';
import Geocoder from 'react-native-geocoding';
import Orientation from 'react-native-orientation';
import IdleTimerManager from 'react-native-idle-timer';
import {map, filter} from 'rxjs/operators';
import {getUniqueId} from 'react-native-device-info';

import {
  accelerometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as Img from '../utils/images.js';
import {getColor, timeToString, uriToBlob} from '../utils/utilFunctions';
import haversine from 'haversine';
import addSpeechFunction, {
  startRecognition,
  cancelRecognizing,
  stopRecognizing,
} from '../utils/speechFunction';
import uploader, {bindUploadListener, uploadPromise} from '../utils/upload';
import RNFS from 'react-native-fs';
export default class MapScreen extends Component {
  // Set sessional data
  state = {
    results: [],
    prevLatitude: 0,
    prevLongitude: 0,
    latitude: null,
    longitude: null,
    timestamp: null,
    speed: null,
    heading: null,
    address: null,
    timeString: null,
    irisRespond: false,
    defects: [],
    newDefects: [],
    hideCamera: false,
    driver: 'test',
    plate: '',
    toggleRecord: true,
    togglePhoto: true,
    showUploadModal: false,
    totalTask: 0,
    routeDefects: [],
    remainTask: 0,
    uploading: false,
    currentZ: -0.45,
    maxZ: -0.45,
    minZ: -0.45,
    isCameraReady: true,
    sensorData: {x: 0, y: 0, z: 0},
    deviceID: null,
  };

  // Setting after mount
  componentDidMount() {
    setUpdateIntervalForType(SensorTypes.accelerometer, 600); // defaults to 100ms
    this.setState({deviceID: getUniqueId()});
    //Let the screen up all the time
    IdleTimerManager.setIdleTimerDisabled(true);
    //lock the screen to landscape
    Orientation.lockToLandscapeRight();
    //listen to the defects data on real-time
    database.ref('roadDefect/').on('value', snapshot => {
      let tempDefects = [];
      let routeDefects = [];

      snapshot.forEach(childSnapShot => {
        //if (childSnapShot.val().url.includes('374BCA')) {
        // let newApp = '63CBE698-118D-48DB-8BF4-FE90FA2E51F4';
        // let oldPath = childSnapShot.val().url.split('/');
        // let oldfilename = oldPath[12];
        // let newPath =
        //   'file:///var/mobile/Containers/Data/Application/' +
        //   newApp +
        //   '/Library/Caches/Camera/' +
        //   oldfilename;
        // console.log('update');
        // database.ref('roadDefect/' + childSnapShot.key).update({
        //   url: newPath,
        // });
        //}
        tempDefects = [
          ...tempDefects,
          [childSnapShot.val(), childSnapShot.key],
        ];
        if (
          typeof childSnapShot.val().latitude == 'number' &&
          typeof childSnapShot.val().longitude == 'number' &&
          (childSnapShot.val().url.includes('@') ||
            !childSnapShot.val().type.includes('A'))
        ) {
          routeDefects = [
            ...routeDefects,
            {
              latitude: childSnapShot.val().latitude,
              longitude: childSnapShot.val().longitude,
            },
          ];
        }
      });

      this.setState({
        defects: tempDefects,
        routeDefects: routeDefects,
      });
    });
  }
  //setting when app is unmounted
  componentWillUnmount() {
    Orientation.lockToPortrait();
    //set the idle timer back to normal
    IdleTimerManager.setIdleTimerDisabled(false);
  }
  subscription = (subscription = accelerometer.subscribe(({x, y, z}) => {
    this.setState({sensorData: {x: x, y: y, z: z}});
  }));

  photoUpdate = async () => {
    if (
      haversine(
        {latitude: this.state.latitude, longitude: this.state.longitude},
        {
          latitude: this.state.prevLatitude,
          longitude: this.state.prevLongitude,
        },
        {unit: 'meter'},
      ) > 3
    ) {
      this.setState({
        prevLatitude: this.state.latitude,
        prevLongitude: this.state.longitude,
      });

      if (this.camera && !this.state.togglePhoto && this.state.isCameraReady) {
        try {
          this.setState({
            isCameraReady: false,
          });
          const data = await this.camera.takePictureAsync({quality: 0.005}); //quality: 1
          let filename = data.uri.split('/')[12];
          let destPath =
            'file://' + RNFS.DocumentDirectoryPath + '/' + filename;
          console.log(data.uri);
          console.log(destPath);
          RNFS.moveFile(data.uri, destPath);
          await database
            .ref('roadDefect/')
            .push({
              date_time: timeToString(this.state.timestamp),
              image: timeToString(this.state.timestamp),
              latitude: this.state.latitude,
              longitude: this.state.longitude,
              heading: this.state.heading,
              url: destPath + '@' + this.state.driver,
              accelerometer: this.state.sensorData,
              device_serial_number: this.state.deviceID,
            })
            .then(
              (x = () => {
                this.setState({
                  maxZ: this.state.currentZ,
                  minZ: this.state.currentZ,
                });
              }),
            );
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  //It is used to following user location
  changeMapView = () => {
    if (this.state.speed > 5) {
      this.map.animateCamera(
        {
          center: {
            latitude: this.state.latitude,
            longitude: this.state.longitude,
          },
          pitch: 63,
          heading: this.state.heading,
          zoom: 18,
        },
        500,
      );
    } else {
      //console.log(this.state.latitude, this.state.longitude);
      this.map.animateToRegion(
        {
          latitude: this.state.latitude,
          longitude: this.state.longitude,
          latitudeDelta: 0.01,
        },
        500,
      );
    }
  };

  togglePhotoPressed = () => {
    if (this.state.togglePhoto) {
      this.state.subscription;
      this.setState({
        togglePhoto: false,
        hideCamera: true,
      });
    } else {
      setTimeout(() => {
        // If it's the last subscription to accelerometer it will stop polling in the native API
        this.subscription.unsubscribe();
      }, 1000);
      this.setState({
        togglePhoto: true,
        hideCamera: false,
      });
      this.props.navigation.navigate('Welcome');
    }
  };
  cameraReady = () => {
    this.setState({
      isCameraReady: true,
    });
  };
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {this.state.togglePhoto
              ? 'Point Camera on road.. Press start when ready..'
              : 'Recording in Progress..'}
          </Text>
        </View>
        <View style={styles.toggleButton1Container}>
          <View style={styles.toggleButton4Container}>
            <TouchableOpacity
              style={
                this.state.togglePhoto
                  ? [styles.toggleButton, {backgroundColor: 'green'}]
                  : [styles.toggleButton, {backgroundColor: 'red'}]
              }
              onPress={this.togglePhotoPressed}>
              <Text style={styles.buttonText}>
                {this.state.togglePhoto ? 'Start' : 'Stop'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <RNCamera
          style={styles.camera}
          ref={ref => {
            this.camera = ref;
          }}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.off}
          captureAudio={false}
          onCameraReady={this.cameraReady}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onGoogleVisionBarcodesDetected={({barcodes}) => {
            console.log(barcodes);
          }}
        />
        <MapView
          ref={ref => {
            this.map = ref;
          }}
          onUserLocationChange={location => {
            //console.log('map Geo data', location.nativeEvent.coordinate);
            this.setState(
              {
                latitude: location.nativeEvent.coordinate.latitude,
                longitude: location.nativeEvent.coordinate.longitude,
                heading: location.nativeEvent.coordinate.heading,
                speed: location.nativeEvent.coordinate.speed,
                timestamp: new Date(),
              },
              () => {
                this.changeMapView();
                this.photoUpdate();
              },
            );
          }}
          style={
            this.state.hideCamera
              ? [styles.map, {zIndex: -1}]
              : [styles.map, {zIndex: -2}]
          }
          provider={'google'}
          showsPointsOfInterest={false}
          loadingEnabled={true}
          customMapStyle={mapStyle}
          showsUserLocation={true}
          zoomEnabled={false}
          zoomTapEnabled={false}
          zoomControlEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          initialRegion={{
            latitude: 43.255978,
            longitude: -79.873014,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          <Geojson
            strokeColor={'red'}
            fillColor={'red'}
            strokeWidth={10.3}
            geojson={testRoads}
          />
          <Polyline
            coordinates={this.state.routeDefects}
            strokeColor="#FF0000" //strokeColor: '#00FF00'
            strokeWidth={3}
          />
        </MapView>
      </SafeAreaView>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {...StyleSheet.absoluteFillObject, zIndex: 1},
  infoBox: {
    position: 'absolute',
    top: 20,
    width: 220,
    height: 70,
    backgroundColor: 'grey',
    opacity: 0.8,
    justifyContent: 'center',
  },
  infoText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 15,
  },
  toggleButton1Container: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 50,
    height: 50,
  },
  toggleButton2Container: {
    position: 'absolute',
    top: 55,
    left: 0,
    width: 50,
    height: 50,
  },
  toggleButton3Container: {
    position: 'absolute',
    top: 110,
    left: 0,
    width: 50,
    height: 50,
  },
  toggleButton4Container: {
    position: 'absolute',
    top: 105,
    left: -10,
    width: 70,
    height: 70,
  },
  toggleButton5Container: {
    position: 'absolute',
    top: 220,
    left: 0,
    width: 50,
    height: 50,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: 'green',
    borderColor: 'white',
    borderWidth: 2,
    borderRadius: 35,
    alignContent: 'center',
    justifyContent: 'center',
  },
  toggleImage: {
    height: 30,
    width: 30,
    tintColor: 'white',
    resizeMode: 'center',
    marginTop: 0,
    marginLeft: 8,
    flex: 1,
    margin: 'auto',
  },
  reportButton: {
    borderRadius: 25,
    height: 50,
    width: 50,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#fff',
  },
  reportButtonContainer: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    flex: 1,
    flexDirection: 'row',
    alignContent: 'space-around',
    justifyContent: 'space-around',
    width: '75%',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  textStyle: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 10,
    fontWeight: 'bold',
  },
  buttonText: {
    flex: 1,
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 20,
    fontWeight: 'bold',
  },
  modal: {
    margin: 50,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'lightyellow',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 1,
    opacity: 0.4,
  },
  title: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  button: {
    position: 'absolute',
    top: 80,
    left: 150,
    width: 80,
    height: 35,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 3,
    padding: 5,
    opacity: 0.8,
    backgroundColor: '#EEE',
    marginHorizontal: 5,
  },
});
