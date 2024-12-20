import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, firestore } from './firebase.config';
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);  // State to toggle password visibility
  const [rememberMe, setRememberMe] = useState(false);
  

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.toLowerCase());
  };

  const handlePasswordReset = async () => {
    if (email === '') {
      Alert.alert('Error', 'Please fill in the email field.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.toLowerCase());
      Alert.alert('Password reset link has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleRememberMe = async () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    if (!newValue) {
      // If unchecked, remove stored credentials
      await AsyncStorage.removeItem('rememberedEmail');
      await AsyncStorage.removeItem('rememberedPassword');
    }
  };

  const handleLogin = async () => {
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail === '' || trimmedPassword === '') {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        Alert.alert(
          'Verify Your Email',
          'Your email is not verified. A verification link has been sent to your email. Please verify your email before logging in.'
        );
        return;
      } else {
        if (rememberMe) {
          // Store credentials if Remember Me is checked
          await AsyncStorage.setItem('rememberedEmail', trimmedEmail);
          await AsyncStorage.setItem('rememberedPassword', trimmedPassword);
        }
        Alert.alert('Successfully Logged In.');
        
        try {
          await updateDoc(doc(firestore, 'users', trimmedEmail), {
            isActive: true, 
          });
          console.log(trimmedEmail + " is active")
        } catch (error) {
          console.error('Error updating user activity:', error);
        }

        navigation.navigate('Home');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Failed.', error.message);
    }
  };

  useEffect(() => {
    const checkStoredCredentials = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('rememberedEmail');
        const storedPassword = await AsyncStorage.getItem('rememberedPassword');
        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error checking stored credentials:', error);
      }
    };
    
    checkStoredCredentials();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <Image source={require('./assets/logo.png')} style={styles.logo} />

        {/* Title */}
        <Text style={styles.title}>Sign in to your Account</Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => setEmail(text)}
          autoCapitalize="none"
        />

        {/* Password Input with Show Password Feature */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}  // Control password visibility
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#ff0000" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          {/* Remember Me */}
          <View style={styles.rememberMeContainer}>
            <TouchableOpacity onPress={toggleRememberMe}>
              <Icon name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color="#ff0000" />
            </TouchableOpacity>
            <Text style={styles.rememberMeText}>Remember Me</Text>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity onPress={handlePasswordReset}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('LoginAdmin')}>
          <Text style={styles.signUpAdminLink}>Sign in as an Admin</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    color: '#007ACC',
    marginVertical: 10,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#0056b3',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  signUpText: {
    color: '#000',
  },
  signUpLink: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
  signUpAdminLink: {
    color: '#007ACC',
    fontWeight: 'bold',
    marginTop: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  rememberMeText: {
    color: '#000',
    marginLeft: 10,
  },
});
