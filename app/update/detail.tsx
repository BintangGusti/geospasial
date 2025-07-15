import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '~/lib/supabase';

export default function DetailRumahScreen() {
  const { id } = useLocalSearchParams();
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkUpdateStatus = async () => {
    const user = await supabase.auth.getUser();
    const email = user.data.user?.email;

    if (!email || !id) return;

    const { data, error } = await supabase
      .from('gis_data_updaterequest')
      .select('*')
      .eq('id_rumah_id', id)
      .eq('dibuat_oleh_users', email)
      .eq('disetujui', false)
      .eq('ditolak', false);

    if (!error && data && data.length > 0) {
      setPendingUpdate(true);
      setPendingUpdateData(data[0]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) checkUpdateStatus();
  }, [id]);

  const renderPendingInput = (label: string, field: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.input, { backgroundColor: '#f0f0f0', color: '#555' }]}>
        {pendingUpdateData?.data?.[field]?.toString() || '-'}
      </Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;
  if (!pendingUpdate || !pendingUpdateData) {
    return (
      <View style={styles.center}>
        <Text>Tidak ada pengajuan perubahan yang sedang diproses.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <ScrollView style={styles.container}>
        <View
          style={{
            padding: 12,
            backgroundColor: '#e3f2fd',
            borderWidth: 1,
            borderColor: '#64b5f6',
            borderRadius: 8,
            margin: 16,
          }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#1565c0' }}>
            📋 Data yang Anda ajukan untuk perubahan:
          </Text>
          {renderPendingInput('Nama Perumahan', 'nama_perumahan')}
          {renderPendingInput('Nama Pemilik', 'nama_pemilik')}
          {renderPendingInput('Alamat Rumah', 'alamat_rumah')}
          {renderPendingInput('Jumlah KK', 'jumlah_kk')}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rumah</Text>
            <Text style={[styles.input, { backgroundColor: '#f0f0f0', color: '#555' }]}>
              {pendingUpdateData.data.rumah_sewa === true ||
              pendingUpdateData.data.rumah_sewa === 'Ya'
                ? 'Sewa'
                : 'Milik Sendiri'}
            </Text>
            {/* pendingUpdateData.photo_rumah */}
          </View>
          {pendingUpdateData.photo_rumah && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Foto yang diajukan</Text>
              <Image
                source={{
                  uri: supabase.storage.from('media').getPublicUrl(pendingUpdateData.photo_rumah)
                    .data.publicUrl,
                }}
                style={{ width: '100%', height: 180, borderRadius: 10 }}
                resizeMode="cover"
              />
            </View>
          )}
          {pendingUpdateData.geometry?.coordinates && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Koordinat yang diajukan</Text>
              <Text style={[styles.input, { backgroundColor: '#f0f0f0', color: '#555' }]}>
                {pendingUpdateData.geometry.coordinates.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputGroup: { marginBottom: 12 },
  label: { fontWeight: 'bold', color: '#333', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    color: '#333',
    backgroundColor: '#f5f5f5',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
