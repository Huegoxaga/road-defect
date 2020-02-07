import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import Orientation from 'react-native-orientation';
import IdleTimerManager from 'react-native-idle-timer';
import {database, storage} from '../utils/firebase';
import {getColor, timeToString, uriToBlob} from '../utils/utilFunctions';
import {getFreeDiskStorage} from 'react-native-device-info';

export default class UploadScreen extends Component {
  state = {
    defects: [],
    showUploadModal: false,
    showConfirmModal: false,
    showCompleteModal: false,
    totalTask: 0,
    remainTask: 0,
    concurrentTask: 0,
    space: 0,
    callCount: 0,
  };
  // Setting after mount
  componentDidMount() {
    //lock the screen to landscape
    Orientation.lockToPortrait();
    getFreeDiskStorage().then(freeDiskStorage => {
      this.setState({
        space: freeDiskStorage,
      });
    });

    //listen to the defects data on real-time
    database
      .ref('roadDefect/')
      .once('value')
      .then(snapshot => {
        let tempDefects = [];
        snapshot.forEach(childSnapShot => {
          tempDefects = [
            ...tempDefects,
            [childSnapShot.val(), childSnapShot.key],
          ];
        });

        let filteredDefect = tempDefects.filter(
          validDefect =>
            typeof validDefect[0].latitude == 'number' &&
            typeof validDefect[0].longitude == 'number' &&
            validDefect[0].url.includes('@'),
        );

        this.setState({
          defects: filteredDefect,
          totalTask: filteredDefect.length,
          remainTask: filteredDefect.length,
        });
      });
  }
  //setting when app is unmounted
  componentWillUnmount() {
    Orientation.unlockAllOrientations();
    IdleTimerManager.setIdleTimerDisabled(false);
  }

  mediaUpload = () => {
    //Let the screen up all the time
    IdleTimerManager.setIdleTimerDisabled(true);
    this.setState(
      {
        showUploadModal: true,
        showConfirmModal: false,
        showCompleteModal: false,
      },
      uploadDelay => {
        setTimeout(upload => {
          this.groupUpload();
        }, 100);
      },
    );
  };

  groupUpload = () => {
    for (i = 0; i < 40; i++) {
      this.uploadPromise(this.state.defects[i])
        .then(() => {
          //console.log(this.state.remainTask);
          this.setState({
            remainTask: --this.state.remainTask,
          });
          if (this.state.remainTask == 0) {
            this.setState({
              showUploadModal: false,
              showConfirmModal: false,
              showCompleteModal: true,
              callCount: 0,
            });
            IdleTimerManager.setIdleTimerDisabled(false);
          }
        })
        .catch(e => console.log(e.message));
    }
  };

  uploadPromise = defect => {
    return new Promise(function(resolve, reject) {
      uriToBlob(defect[0].url.split('@')[0]).then(function(blob) {
        let task = storage
          .ref()
          .child('videos/' + '_' + defect[1])
          .put(blob);
        //Update progress bar
        task.on(
          'state_changed',
          function progress(snapshot) {
            var percentage =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            //console.log(percentage);
          },
          function error(err) {},
          function complete() {
            task.snapshot.ref.getDownloadURL().then(function(link) {
              database.ref('roadDefect/' + defect[1]).update({
                url: link,
              });
            });
            blob.close();
            resolve();
          },
        );
      });
    });
  };
  getModal() {
    let modal;

    if (this.state.showConfirmModal) {
      modal = (
        <View style={[styles.modalView, {backgroundColor: 'black'}]}>
          <TouchableOpacity
            onPress={this.cancelUpload.bind(this)}
            style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.message, {top: 150, width: 200}]}>
            Are you sure you want to upload?
          </Text>
          <Text style={[styles.message, {top: 250, width: 200}]}>
            A stable Wifi connection is required.
          </Text>
          <TouchableOpacity
            style={[styles.button, {width: 250, bottom: 120}]}
            onPress={this.mediaUpload.bind(this)}>
            <Text style={styles.buttonText}>Continue Upload</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (this.state.showUploadModal) {
      modal = (
        <React.Fragment>
          <TouchableOpacity
            onPress={this.cancelUpload.bind(this)}
            style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.message, {top: 150}]}>Upload in progress..</Text>
          <View style={[styles.infoBox, {top: 200}]}>
            <ActivityIndicator
              color="white"
              style={[styles.indicator, {top: 15}]}
              size="large"
            />
            <Text style={[styles.message, {top: 50}]}>
              {(
                ((this.state.totalTask - this.state.remainTask) /
                  this.state.totalTask) *
                100
              ).toFixed(2)}
              %
            </Text>
            <Text style={[styles.submessage, {top: 90, fontSize: 11}]}>
              {this.state.remainTask} data points remaining...
            </Text>
          </View>
          <Text style={[styles.message, {top: 350}]}>
            Make sure phone is charged and has a stable Wifi connection.
          </Text>
        </React.Fragment>
      );
    } else {
      modal = (
        <View style={styles.modalView}>
          <Text style={[styles.message, {top: 150, fontSize: 30}]}>
            Upload Completed!
          </Text>
          <TouchableOpacity
            style={[styles.button, {width: 250, bottom: 120}]}
            onPress={() => {
              this.cancelUpload.bind(this);
              this.props.navigation.navigate('Welcome');
            }}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return modal;
  }

  cancelUpload() {
    this.setState({
      showUploadModal: false,
      showConfirmModal: false,
      showCompleteModal: false,
    });
  }

  showConfirm() {
    if (this.state.remainTask != 0) {
      this.setState({
        showUploadModal: false,
        showConfirmModal: true,
        showCompleteModal: false,
      });
    }
  }

  showInfo() {
    let info;
    if (this.state.remainTask == 0) {
      info = 'All photos have been uploaded.';
    } else {
      info = this.state.remainTask + ' photos have not been uploaded.';
    }
    return info;
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={() => this.props.navigation.navigate('Welcome')}
          style={styles.cancel}>
          <Text style={[styles.cancelText, {color: 'black'}]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{this.showInfo()}</Text>
        <Text style={styles.info}>
          Storage Status: {(this.state.space / 1000000000).toFixed(0) + ' '}
          GB Left
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.showConfirm.bind(this)}>
          <Text style={styles.buttonText}>Upload</Text>
        </TouchableOpacity>
        <Modal
          animationType={'fade'}
          transparent={true}
          visible={
            this.state.showUploadModal ||
            this.state.showConfirmModal ||
            this.state.showCompleteModal
          }>
          <SafeAreaView style={styles.modalView}>
            {this.getModal()}
          </SafeAreaView>
        </Modal>
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
  title: {
    position: 'absolute',
    top: 80,
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: '300',
    fontSize: 15,
  },
  message: {
    position: 'absolute',
    marginVertical: 5,
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 20,
    color: 'white',
  },
  submessage: {
    position: 'absolute',
    marginVertical: 5,
    textAlign: 'center',
    fontWeight: '400',
    fontSize: 15,
    color: 'white',
  },
  infoBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 120,
    backgroundColor: 'red',
    borderRadius: 10,
  },
  info: {
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: '300',
    fontSize: 15,
    position: 'absolute',
    bottom: 90,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 20,
  },
  button: {
    position: 'absolute',
    bottom: 15,
    margin: 20,
    width: 180,
    height: 60,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 3,
    padding: 15,
    opacity: 0.8,
    backgroundColor: '#EEE',
    marginHorizontal: 5,
  },
  cancel: {
    position: 'absolute',
    top: 10,
    right: 2,
    margin: 20,
    width: 80,
    height: 30,
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '300',
    fontSize: 20,
    color: 'white',
  },
  indicator: {
    position: 'absolute',
    top: 55,
  },
  modalView: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#166101',
    alignItems: 'center',
    opacity: 0.9,
  },
});

const cc = StyleSheet.create({
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
