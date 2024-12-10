import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DataAnalyticsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Data Analytics Page</Text>
    </View>
  );
};

export default DataAnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
