import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    let sound = null;

    const playChimeSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: chimeSound } = await Audio.Sound.createAsync(
           require('../assets/sounds/chime.mp3'),
           { shouldPlay: true, volume: 0.5 }
         );
         sound = chimeSound;
        
      } catch (error) {
        console.log('Audio playback failed:', error);
      }
    };

    playChimeSound();

    // Show splash for 2.5 seconds then finish (no animations)
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <LinearGradient
      colors={['#654E3F', '#8B6F47', '#A17F5C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>
          StoryKeep
        </Text>

        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>Turn Family Photos Into Living Memories</Text>
          <Text style={styles.subtag}>Digitize • Restore • Preserve</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  taglineContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
  },
  subtag: {
    fontSize: 14,
    color: '#F4A261',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
