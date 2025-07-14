import { Redirect } from 'expo-router';
import 'react-native-polyfill-globals/auto';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;
export default function RootScreen() {
  return <Redirect href="/(home)/" />;
}
