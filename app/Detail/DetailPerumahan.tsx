// app/Detail/DetailPerumahan.tsx
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '~/lib/supabase';

export default function DetailPerumahan() {
  const { id } = useLocalSearchParams();
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (id) fetchDetail(id as string);
  }, [id]);

  const fetchDetail = async (id: string) => {
    const { data, error } = await supabase
      .from('gis_data_perumahan')
      .select(
        `
        id_perumahan,
        nama_perumahan,
        alamat_lengkap_perumahan,
        photo_perumahan,
        gis_data_kecamatan(kecamatan),
        gis_data_kelurahan(kelurahan)
      `
      )
      .eq('id_perumahan', id)
      .single();

    if (error) {
      console.error('Error fetching detail:', error);
      return;
    }

    const img = data.photo_perumahan
      ? {
          uri: supabase.storage.from('media').getPublicUrl(data.photo_perumahan).data.publicUrl,
        }
      : require('../../assets/images/perumahan.jpeg');

    setDetail({ ...data, image: img });
  };

  if (!detail) {
    return (
      <View style={styles.center}>
        <Text>Memuat detail...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={detail.image} style={styles.image} />
      <Text style={styles.title}>{detail.nama_perumahan}</Text>
      <Text style={styles.label}>Alamat:</Text>
      <Text style={styles.text}>{detail.alamat_lengkap_perumahan}</Text>
      <Text style={styles.label}>Kecamatan:</Text>
      <Text style={styles.text}>{detail.gis_data_kecamatan?.kecamatan}</Text>
      <Text style={styles.label}>Kelurahan:</Text>
      <Text style={styles.text}>{detail.gis_data_kelurahan?.kelurahan}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  text: {
    fontSize: 16,
    color: '#555',
  },
});
