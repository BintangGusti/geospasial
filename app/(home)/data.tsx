import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Card } from 'react-native-paper';
import { supabase } from '~/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PengajuanScreen() {
  const [dataRumah, setDataRumah] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [rejectedIds, setRejectedIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDataRumah();
    }, [])
  );

  const fetchDataRumah = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      if (!userEmail) return;

      // Ambil semua rumah milik user
      const { data: rumahData } = await supabase
        .from('gis_data_rumah')
        .select(
          `
    *,
    gis_data_perumahan: nama_perumahan_id (
      nama_perumahan,
      kecamatan: kecamatan_id (kecamatan),
      kelurahan: kelurahan_id (kelurahan)
    )
  `
        )
        .eq('dibuat_oleh_users', userEmail)
        .order('created_at', { ascending: false });

      // Ambil semua update yang pending
      const { data: pending } = await supabase
        .from('gis_data_updaterequest')
        .select('id_rumah_id')
        .eq('dibuat_oleh_users', userEmail)
        .eq('disetujui', false)
        .eq('ditolak', false);

      // Ambil semua update yang ditolak
      const { data: rejected } = await supabase
        .from('gis_data_updaterequest')
        .select('id_rumah_id')
        .eq('dibuat_oleh_users', userEmail)
        .eq('ditolak', true);

      setPendingIds(pending?.map((d) => d.id_rumah_id) || []);
      setRejectedIds(rejected?.map((d) => d.id_rumah_id) || []);
      setDataRumah(rumahData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (item: any, index: number) => {
    if (!item) return null;

    const statusColor = item.rumah_sewa ? '#ff9800' : '#1e88e5';
    const status = item.rumah_sewa ? 'Sewa' : 'Milik Sendiri';

    let statusLabel = '✅ Terverifikasi';
    let labelColor = '#4caf50';

    if (pendingIds.includes(item.id_rumah)) {
      statusLabel = '⏳ Menunggu Persetujuan';
      labelColor = '#ff9800';
    } else if (rejectedIds.includes(item.id_rumah)) {
      statusLabel = '❌ Ditolak';
      labelColor = '#f44336';
    }

    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/Detail/rumah', params: { id: item.id_rumah } })}>
        <Animated.View entering={FadeInUp.delay(index * 100)} style={{ marginBottom: 16 }}>
          <Card style={[styles.card, { borderColor: statusColor, borderWidth: 1 }]}>
            <Card.Content>
              <Text style={styles.cardTitle}>{item.nama_pemilik}</Text>
              <Text style={styles.cardText}>
                🏠 Nama Perumahan: {item.gis_data_perumahan?.nama_perumahan}
              </Text>
              <Text style={styles.cardText}>📍 Alamat: {item.alamat_rumah}</Text>
              <Text style={styles.cardText}>👥 Jumlah KK: {item.jumlah_kk}</Text>
              <Text style={styles.cardText}>🧱 Rumah: {status}</Text>
              <Text style={[styles.statusLabel, { color: labelColor }]}>
                📄 Status: {statusLabel}
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      <Text style={styles.heading}>Data Rumah Anda</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1e88e5" style={{ marginTop: 20 }} />
      ) : dataRumah.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Tidak ada data rumah.Tekan Tombol di Bawah Untuk Melakukan Pengajuan Rumah Anda Sendiri.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={dataRumah}
          keyExtractor={(item) => item?.id_rumah?.toString()}
          renderItem={({ item, index }) => renderCard(item, index)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tambah/pengajuan')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  cardText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  statusLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#1e88e5',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00050aff',
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 16,
  },
});
