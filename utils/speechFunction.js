import Voice from 'react-native-voice';

export default bindSpeech = () => {
  //Bind Event handler for of Voice Recognition states.
  Voice.onSpeechError = speechError;
  Voice.onSpeechResults = speechResults;
  Voice.onSpeechEnd = speechEnd;
  Voice.onSpeechStart = speechStart;
  Voice.onSpeechRecognized = speechRecognized;
};

speechStart = e => {
  console.log('onSpeechStart called');
  this.setState({
    toggleRecord: false,
  });
};

speechError = e => {
  console.log('onSpeechError called: ', e.error.message);
  if (e.error.message.includes('216')) {
    this.startRecognition();
  } else if (e.error.message.includes('203')) {
    this.setState({
      toggleRecord: true,
    });
  }
};

speechEnd = e => {
  console.log('onSpeechEnd called');
  this.setState({
    toggleRecord: true,
  });
};

speechRecognized = e => {
  console.log('onSpeechRecognized called');
};

speechResults = e => {
  //Invoked when SpeechRecognizer is finished recognizing
  console.log('onSpeechResults: ', e.value[0]);

  if (e.value[0].includes('Iris') && e.value[0].length < 200) {
    if (!this.state.irisRespond) {
      Tts.speak('Yes?');
      this.setState({
        irisRespond: true,
        cancelUpload: false,
      });
      console.log('canel set to false');
    }

    if (e.value[0].includes('shoulder')) {
      this.setState({
        irisRespond: false,
      });
      this.cancelRecognizing();
      this.recordUpdate('SD');
    } else if (e.value[0].includes('crack')) {
      this.setState({
        irisRespond: false,
      });
      this.cancelRecognizing();
      this.recordUpdate('C');
    } else if (e.value[0].includes('debris')) {
      this.setState({
        irisRespond: false,
      });
      this.cancelRecognizing();
      this.recordUpdate('D');
    } else if (e.value[0].includes('bridge')) {
      this.setState({
        irisRespond: false,
      });
      this.cancelRecognizing();
      this.recordUpdate('B');
    } else if (e.value[0].includes('road') || e.value[0].includes('Road')) {
      this.setState({
        irisRespond: false,
      });
      this.cancelRecognizing();
      this.recordUpdate('RD');
    } else if (e.value[0].includes('pothole')) {
      if (e.value[0].includes('shoulder')) {
        this.setState({
          irisRespond: false,
        });
        this.cancelRecognizing();
        this.recordUpdate('PS');
      } else if (e.value[0].includes('non')) {
        this.setState({
          irisRespond: false,
        });
        this.cancelRecognizing();
        this.recordUpdate('PN');
      } else {
        this.setState({
          irisRespond: false,
        });
        this.cancelRecognizing();
        this.recordUpdate('P');
      }
    }
  } else if (e.value[0].includes('Cancel')) {
    this.setState({
      cancelUpload: true,
    });
    console.log('cancel set to true');
    this.cancelRecognizing();
  } else {
    this.cancelRecognizing();
  }

  this.setState({
    results: e.value,
  });
};

////////////////////////////////////////////////////////
//This block set the functions that controls the state of the voice recognition.
export async function startRecognition() {
  this.setState({
    results: [],
  });
  try {
    await Voice.start('en-US');
  } catch (e) {
    console.error(e);
  }
}

export async function cancelRecognizing() {
  try {
    await Voice.cancel();
  } catch (e) {
    console.error(e);
  }
}

export async function stopRecognizing() {
  try {
    await Voice.stop();
  } catch (e) {
    console.error(e);
  }
}
