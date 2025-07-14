import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '~/lib/supabase';

const Penambahan = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddRequests();
  }, []);

  const fetchAddRequests = async () => {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;

    const { data, error } = await supabase
      .from('gis_data_addrequest')
      .select('*')
      .eq('dibuat_oleh_users', email);

    if (!error) {
      setData(data);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.scene}>
      <Text style={styles.title}>Riwayat Penambahan</Text>
      {data.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888' }}>Belum ada riwayat</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardText}>📅 {new Date(item.dibuat_pada).toLocaleString()}</Text>
              <Text style={styles.cardText}>
                Status:{' '}
                {item.disetujui
                  ? '✅ Disetujui'
                  : item.ditolak
                    ? '❌ Ditolak'
                    : '⏳ Menunggu Persetujuan'}
              </Text>

              {item.photo_rumah && (
                <Image
                  source={{
                    uri: supabase.storage.from('media').getPublicUrl(item.photo_rumah).data
                      .publicUrl,
                  }}
                  style={styles.image}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const Perubahan = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdateRequests();
  }, []);

  const fetchUpdateRequests = async () => {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;

    const { data, error } = await supabase
      .from('gis_data_updaterequest')
      .select('*')
      .eq('dibuat_oleh_users', email);

    if (!error) {
      setData(data);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={styles.scene}>
      <Text style={styles.title}>Riwayat Perubahan</Text>
      {data.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#888' }}>Belum ada riwayat</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardText}>📅 {new Date(item.dibuat_pada).toLocaleString()}</Text>
              <Text style={styles.cardText}>
                Status:{' '}
                {item.disetujui
                  ? '✅ Disetujui'
                  : item.ditolak
                    ? '❌ Ditolak'
                    : '⏳ Menunggu Persetujuan'}
              </Text>
              {item.photo_rumah && (
                <Image
                  source={{
                    uri: supabase.storage.from('media').getPublicUrl(item.photo_rumah).data
                      .publicUrl,
                  }}
                  style={styles.image}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default function RiwayatScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'penambahan', title: 'Penambahan' },
    { key: 'perubahan', title: 'Perubahan' },
  ]);

  const renderScene = SceneMap({
    penambahan: Penambahan,
    perubahan: Perubahan,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: '#4285F4' }}
            style={{ backgroundColor: 'white' }}
            activeColor="#4285F4"
            inactiveColor="#ccc"
            labelStyle={{ fontWeight: 'bold' }}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    resizeMode: 'cover',
  },
});
