import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Card } from 'react-native-paper';
import { supabase } from '~/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  FadeInUp,
  BounceIn,
  BounceOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PengajuanScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'menunggu' | 'disetujui' | 'ditolak'>('menunggu');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const currentUser = await supabase.auth.getUser();
      const userEmail = currentUser.data.user?.email;

      const { data, error } = await supabase
        .from('gis_data_addrequest')
        .select('*')
        .eq('dibuat_oleh_users', userEmail)
        .order('dibuat_pada', { ascending: false });

      if (error) {
        console.error('Error fetching pengajuan:', error);
      } else {
        setData(data || []);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCard = (item: any, index: number) => {
    const content = item.data;
    const statusColor = item.disetujui ? 'green' : item.ditolak ? 'red' : '#1e88e5';
    const statusText = item.disetujui
      ? '✅ Disetujui'
      : item.ditolak
        ? '❌ Ditolak'
        : '⏳ Menunggu Persetujuan';

    return (
      <Animated.View
        key={item.id}
        entering={FadeInUp.delay(index * 100)}
        style={{ marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => {
            setSelectedItem(item);
            setModalVisible(true);
          }}>
          <Card style={[styles.card, { borderColor: statusColor, borderWidth: 1 }]}>
            <Card.Content>
              <Text style={styles.cardTitle}>{content?.nama_pemilik}</Text>
              <Text style={styles.cardText}>📍Alamat Rumah: {content?.alamat_rumah}</Text>
              <Text style={styles.cardText}>
                🏠Status Rumah: {content?.rumah_sewa ? 'Sewa' : 'Milik Sendiri'}
              </Text>
              <Text style={styles.cardText}>👥Jumlah KK: {content?.jumlah_kk}</Text>
            </Card.Content>
            <Card.Actions>
              <Text style={[styles.cardStatus, { color: statusColor }]}>{statusText}</Text>
            </Card.Actions>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredData = data.filter((item) => {
    if (selectedTab === 'menunggu') return !item.disetujui && !item.ditolak;
    if (selectedTab === 'disetujui') return item.disetujui;
    if (selectedTab === 'ditolak') return item.ditolak;
    return true;
  });

  return (
    <SafeAreaView style={styles.wrapper} edges={['top']}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {['menunggu', 'disetujui', 'ditolak'].map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab as any)}
              style={{
                flex: 1,
                marginHorizontal: 4,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: isActive ? '#1e88e5' : '#f0f0f0',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  color: isActive ? '#fff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                }}>
                {tab === 'menunggu' ? 'Menunggu' : tab === 'disetujui' ? 'Disetujui' : 'Ditolak'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#1e88e5" style={{ marginTop: 20 }} />
      ) : filteredData.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Tidak ada data pengajuan.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => renderCard(item, index)}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {selectedItem && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>📄 Detail Pengajuan</Text>
              <View style={styles.modalContent}>
                <Text style={styles.modalLabel}>
                  👤 Nama Pemilik:{' '}
                  <Text style={styles.modalValue}>{selectedItem?.data?.nama_pemilik}</Text>
                </Text>

                <Text style={styles.modalLabel}>
                  📍 Alamat:{' '}
                  <Text style={styles.modalValue}>{selectedItem?.data?.alamat_rumah}</Text>
                </Text>

                <Text style={styles.modalLabel}>
                  🏠 Status Rumah:{' '}
                  <Text style={styles.modalValue}>
                    {selectedItem?.data?.rumah_sewa ? 'Sewa' : 'Milik Sendiri'}
                  </Text>
                </Text>

                <Text style={styles.modalLabel}>
                  👥 Jumlah KK:{' '}
                  <Text style={styles.modalValue}>{selectedItem?.data?.jumlah_kk}</Text>
                </Text>

                <Text style={styles.modalLabel}>
                  🏘️ Nama Perumahan:{' '}
                  <Text style={styles.modalValue}>{selectedItem?.data?.nama_perumahan}</Text>
                </Text>

                {/* Tambahkan field lain jika ada */}
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
                <Text style={styles.modalCloseText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* FAB - Tambah Data */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/tambah/form')}>
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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
    elevation: 2,
  },

  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: '#1e88e5',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
  cardStatus: {
    marginTop: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e88e5',
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 20,
  },
  modalLabel: {
    fontWeight: '600',
    color: '#444',
    marginTop: 10,
  },
  modalValue: {
    color: '#222',
    fontSize: 14,
    fontWeight: 'normal',
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e88e5',
    borderRadius: 8,
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
