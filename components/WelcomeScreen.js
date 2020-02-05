import React, {Component} from 'react';
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import Orientation from 'react-native-orientation';
import {getFreeDiskStorage} from 'react-native-device-info';
import * as Img from '../utils/images.js';

export default class WelcomeScreen extends Component {
  state = {
    space: 0,
  };
  componentDidMount() {
    //lock the screen to landscape
    Orientation.lockToPortrait();
    getFreeDiskStorage().then(freeDiskStorage => {
      this.setState({
        space: freeDiskStorage,
      });
    });
  }

  //setting when app is unmounted
  componentWillUnmount() {
    Orientation.unlockAllOrientations();
  }
  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Image
          style={styles.image}
          source={{
            uri: Img.irisMobile,
          }}
        />
        <Text style={styles.title}>Choose Action</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.props.navigation.navigate('Map')}>
          <Text style={styles.buttonText}>New Patrol</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => this.props.navigation.navigate('Upload')}>
          <Text style={styles.buttonText}>Upload Files</Text>
        </TouchableOpacity>
        <Text style={styles.info}>
          Storage Status: {(this.state.space / 1000000000).toFixed(0) + ' '}
          GB Left
        </Text>
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
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: '300',
    fontSize: 20,
  },
  image: {
    width: 200,
    height: 30,
    position: 'absolute',
    top: 40,
    resizeMode: 'cover',
  },
  info: {
    marginVertical: 20,
    textAlign: 'center',
    fontWeight: '300',
    fontSize: 15,
    position: 'absolute',
    bottom: 10,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 20,
  },
  button: {
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
});
