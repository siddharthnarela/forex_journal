import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigation from './TabNavigation';
import Backtest from './screens/Backtest';

// Create screen components

     

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="TabNavigation"
        screenOptions={{
          headerShown: false,
        }}
        >
        <Stack.Screen 
          name="TabNavigation" 
          component={TabNavigation}
        />
        <Stack.Screen 
          name="Backtest" 
          component={Backtest}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

