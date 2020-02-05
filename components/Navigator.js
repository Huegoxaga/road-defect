import React, {Component} from 'react';
import WelcomeScreen from './WelcomeScreen';
import MapScreen from './MapScreen';
import UploadScreen from './UploadScreen';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';

// const AppNavigator = createStackNavigator(
//   {
//     Welcome: WelcomeScreen,
//     Map: MapScreen,
//     Upload: UploadScreen,
//   },
//   {
//     initialRouteName: 'Welcome',
//     defaultNavigationOptions: {
//       headerShown: false,
//     },
//   },
// );

// export default createAppContainer(AppNavigator);

import createAnimatedSwitchNavigator from 'react-navigation-animated-switch';
import {Transition} from 'react-native-reanimated';

const AppNavigator = createAnimatedSwitchNavigator(
  {
    Welcome: WelcomeScreen,
    Map: MapScreen,
    Upload: UploadScreen,
  },
  {
    initialRouteName: 'Welcome',
    defaultNavigationOptions: {
      headerShown: false,
    },
  },
  {
    // The previous screen will slide to the bottom while the next screen will fade in
    transition: (
      <Transition.Together>
        <Transition.Out
          type="slide-bottom"
          durationMs={400}
          interpolation="easeIn"
        />
        <Transition.In type="fade" durationMs={800} />
      </Transition.Together>
    ),
  },
);
export default createAppContainer(AppNavigator);
