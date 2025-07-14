import { Redirect, Slot, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { useAuth } from '~/providers/AuthProvider';

export default function HomeLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/landingPage" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#ffffff', // warna teks aktif (putih)
          // tabBarInactiveTintColor: "#000", // warna teks non-aktif (abu-abu muda)
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: '#4285F4',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 0.96} viewBox="0 0 27 26" fill="none">
                <Path
                  d="M20.2557 25.0213H6.07427C2.71873 25.0213 0 22.4232 0 19.231V10.598C0 9.01345 1.02871 7.02121 2.35133 6.04257L8.9522 1.14936C10.9361 -0.318598 14.108 -0.3885 16.1654 0.986254L23.7337 6.03092C25.1911 6.99791 26.33 9.0717 26.33 10.7611V19.2426C26.33 22.4232 23.6113 25.0213 20.2557 25.0213ZM10.0789 2.52412L3.47801 7.41733C2.60851 8.06976 1.83698 9.54937 1.83698 10.598V19.231C1.83698 21.4562 3.73519 23.2737 6.07427 23.2737H20.2557C22.5948 23.2737 24.493 21.4679 24.493 19.2426V10.7611C24.493 9.64258 23.648 8.09306 22.6805 7.46393L15.1122 2.41927C13.7161 1.48723 11.4137 1.53383 10.0789 2.52412Z"
                  fill="#ffffff"
                />
              </Svg>
            ),
          }}
        />

        {/* <Tabs.Screen
          name="edit"
          options={{
            title: 'Edit',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 1.1} viewBox="0 0 24 24" fill="none">
                <Path d="M12 20h9" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
                <Path
                  d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5Z"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          }}
        /> */}

        <Tabs.Screen
          name="data"
          options={{
            title: 'Data',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 1.1} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          }}
        />

        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 1.42} viewBox="0 0 24 34" fill="none">
                <Path
                  d="M12 1C10.5542 1.00062 9.1227 1.28935 7.78785 1.8496C6.45301 2.40986 5.24109 3.23059 4.22173 4.26464C2.15712 6.359 0.998783 9.19258 1 12.1458C1 15.6863 1.90877 18.2619 5.40233 22.5774C7.02528 24.4381 8.44728 26.4676 9.64431 28.6318C10.911 31.2338 10.7617 33 12 33C13.2383 33 13.089 31.2338 14.3557 28.6318C15.5527 26.4676 16.9747 24.438 18.5977 22.5774C22.0912 18.2619 23 15.6861 23 12.1458C23.0012 9.19259 21.8428 6.35902 19.7783 4.26464C18.7589 3.23059 17.547 2.40986 16.2121 1.8496C14.8773 1.28935 13.4458 1.00062 12 1Z"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <Path
                  d="M12 16.36c2.337 0 4.231-1.91 4.231-4.267 0-2.358-1.894-4.267-4.231-4.267S7.769 9.735 7.769 12.093c0 2.357 1.894 4.267 4.231 4.267Z"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </Svg>
            ),
          }}
        />

        <Tabs.Screen
          name="riwayat"
          options={{
            title: 'Riwayat',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 1.1} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 8v5l4 2"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M21 12a9 9 0 1 1-6.219-8.555"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size = 28 }) => (
              <Svg width={size} height={size * 1.22} viewBox="0 0 23 28" fill="none">
                <Path
                  d="M11.308 14.489c3.314 0 6.0-2.801 6.0-6.255 0-3.455-2.686-6.256-6.0-6.256-3.314 0-6 2.801-6 6.256 0 3.454 2.686 6.255 6 6.255Z"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M21.616 27c0-4.842-4.62-8.758-10.308-8.758C5.62 18.242 1 22.158 1 27"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ),
          }}
        />
      </Tabs>
    </>
  );
}
