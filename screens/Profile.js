import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const STORAGE_KEY = '@forex_account_details';
const { width } = Dimensions.get('window');

const CustomCard = ({ title, value, subtitle, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value || '0.00'}</Text>
    {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
  </View>
);

const CustomInput = ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        style={[styles.input, icon && styles.inputWithIcon]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  </View>
);

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    balance: '',
    leverage: '',
    broker: '',
    currency: '',
    profitLoss: '',
    equity: '',
    marginLevel: ''
  });

  useEffect(() => {
    loadAccountDetails();
  }, []);

  const loadAccountDetails = async () => {
    try {
      const savedDetails = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDetails !== null) {
        setAccountDetails(JSON.parse(savedDetails));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load account details');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAccountDetails = async () => {
    try {
      if (!accountDetails.accountNumber || !accountDetails.broker) {
        Alert.alert('Validation Error', 'Account number and broker are required');
        return;
      }

      setIsSaving(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accountDetails));
      Alert.alert('Success', 'Account details saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save account details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setAccountDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#6C5CE7', '#8E2DE2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Trading Account</Text>
        <Text style={styles.headerSubtitle}>Manage your forex account details</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.overviewContainer}>
          <CustomCard
            title="Balance"
            value={`$${accountDetails.balance || '0.00'}`}
            color="#6C5CE7"
          />
          <CustomCard
            title="Equity"
            value={`$${accountDetails.equity || '0.00'}`}
            color="#00B894"
          />
          <CustomCard
            title="Profit/Loss"
            value={`$${accountDetails.profitLoss || '0.00'}`}
            subtitle="Current Session"
            color={parseFloat(accountDetails.profitLoss) >= 0 ? '#00B894' : '#FF7675'}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <CustomInput
            label="Account Number"
            value={accountDetails.accountNumber}
            onChangeText={(value) => handleInputChange('accountNumber', value)}
            placeholder="Enter account number"
            keyboardType="numeric"
          />

          <CustomInput
            label="Broker"
            value={accountDetails.broker}
            onChangeText={(value) => handleInputChange('broker', value)}
            placeholder="Enter broker name"
          />

          <CustomInput
            label="Currency"
            value={accountDetails.currency}
            onChangeText={(value) => handleInputChange('currency', value)}
            placeholder="Enter account currency"
          />

          <Text style={styles.sectionTitle}>Trading Parameters</Text>

          <CustomInput
            label="Leverage"
            value={accountDetails.leverage}
            onChangeText={(value) => handleInputChange('leverage', value)}
            placeholder="Enter leverage (e.g., 1:100)"
          />

          <CustomInput
            label="Margin Level (%)"
            value={accountDetails.marginLevel}
            onChangeText={(value) => handleInputChange('marginLevel', value)}
            placeholder="Enter margin level"
            keyboardType="decimal-pad"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveAccountDetails}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Account Details</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollView: {
    flex: 1,
    // paddingTop: 50,
    // paddingBottom: 1000
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    marginTop: 5,
  },
  overviewContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: -40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: width * 0.44,
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2D3436',
  },
  inputWithIcon: {
    paddingLeft: 40,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  saveButton: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    margin: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});