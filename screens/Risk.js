import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@forex_account_details';

export default function Risk() {
  const [accountDetails, setAccountDetails] = useState(null);
  const [calculatorInputs, setCalculatorInputs] = useState({
    riskPercentage: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    currency: 'EURUSD',
  });
  const [results, setResults] = useState({
    positionSize: 0,
    pipValue: 0,
    potentialLoss: 0,
    potentialProfit: 0,
    riskRewardRatio: 0,
  });
  
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    loadAccountDetails();
    animateHeader();
  }, []);

  const animateHeader = () => {
    Animated.spring(animation, {
      toValue: 1,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const loadAccountDetails = async () => {
    try {
      const savedDetails = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedDetails !== null) {
        setAccountDetails(JSON.parse(savedDetails));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load account details');
    }
  };

  const calculatePipValue = (lotSize, currency = 'EURUSD') => {
    const pipValues = {
      EURUSD: 10,
      GBPUSD: 10,
      USDJPY: 9.30,
      USDCHF: 10,
      AUDUSD: 10,
      NZDUSD: 10,
    };
    return (pipValues[currency] || 10) * lotSize;
  };

  const calculateResults = () => {
    if (!accountDetails?.balance || !calculatorInputs.riskPercentage) {
      Alert.alert('Error', 'Please ensure account balance and risk percentage are set');
      return;
    }

    const balance = parseFloat(accountDetails.balance);
    const riskPercentage = parseFloat(calculatorInputs.riskPercentage);
    const entryPrice = parseFloat(calculatorInputs.entryPrice);
    const stopLoss = parseFloat(calculatorInputs.stopLoss);
    const takeProfit = parseFloat(calculatorInputs.takeProfit);

    if (isNaN(balance) || isNaN(riskPercentage) || isNaN(entryPrice) || 
        isNaN(stopLoss) || isNaN(takeProfit)) {
      Alert.alert('Error', 'Please fill in all fields with valid numbers');
      return;
    }

    const riskAmount = (balance * riskPercentage) / 100;
    const pipDistance = Math.abs(entryPrice - stopLoss) * 10000;
    const pipValue = riskAmount / pipDistance;
    const lotSize = pipValue / 10;

    const potentialLoss = riskAmount;
    const pipDistanceToTP = Math.abs(takeProfit - entryPrice) * 10000;
    const potentialProfit = (pipDistanceToTP * pipValue);
    const riskRewardRatio = potentialProfit / potentialLoss;

    setResults({
      positionSize: lotSize.toFixed(2),
      pipValue: pipValue.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      riskRewardRatio: riskRewardRatio.toFixed(2),
    });
  };

  const renderInput = (label, value, key, placeholder) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(value) => setCalculatorInputs(prev => ({...prev, [key]: value}))}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.inputGradient}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.headerContainer,
          {
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                })
              }
            ],
            opacity: animation
          }
        ]}>
          <LinearGradient
            colors={['#1E3B70', '#29539B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* <Text style={styles.headerTitle}>Risk Calculator</Text> */}
            {accountDetails && (
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Account Balance</Text>
                <Text style={styles.balanceText}>
                  {accountDetails.currency} {parseFloat(accountDetails.balance).toLocaleString()}
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Trade Parameters</Text>
            
            {renderInput('Risk Percentage (%)', calculatorInputs.riskPercentage, 'riskPercentage', 'Enter risk %')}
            {renderInput('Entry Price', calculatorInputs.entryPrice, 'entryPrice', 'Enter entry price')}
            {renderInput('Stop Loss', calculatorInputs.stopLoss, 'stopLoss', 'Enter stop loss')}
            {renderInput('Take Profit', calculatorInputs.takeProfit, 'takeProfit', 'Enter take profit')}

            <TouchableOpacity
              style={styles.calculateButton}
              onPress={calculateResults}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Text style={styles.calculateButtonText}>Calculate Risk</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {results.positionSize > 0 && (
            <Animated.View 
              style={[styles.resultsCard, {
                opacity: animation,
                transform: [{
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  })
                }]
              }]}
            >
              <Text style={styles.sectionTitle}>Trade Analysis</Text>
              
              <View style={styles.resultGrid}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Position Size</Text>
                  <Text style={styles.resultValue}>{results.positionSize} Lots</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Pip Value</Text>
                  <Text style={styles.resultValue}>${results.pipValue}</Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Potential Loss</Text>
                  <Text style={[styles.resultValue, styles.lossText]}>
                    -${results.potentialLoss}
                  </Text>
                </View>

                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Potential Profit</Text>
                  <Text style={[styles.resultValue, styles.profitText]}>
                    +${results.potentialProfit}
                  </Text>
                </View>
              </View>

              <View style={styles.riskRewardContainer}>
                <Text style={styles.riskRewardLabel}>Risk/Reward Ratio</Text>
                <Text style={styles.riskRewardValue}>1:{results.riskRewardRatio}</Text>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 300,
  },
  headerContainer: {
    marginBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  balanceContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
    zIndex: 1,
  },
  inputGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  calculateButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  gradientButton: {
    padding: 18,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  resultItem: {
    width: '50%',
    padding: 8,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profitText: {
    color: '#27ae60',
  },
  lossText: {
    color: '#e74c3c',
  },
  riskRewardContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskRewardLabel: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '600',
  },
  riskRewardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});