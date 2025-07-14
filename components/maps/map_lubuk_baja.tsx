import Mapbox from '@rnmapbox/maps';
import { Stack } from 'expo-router';
import { Button, Modal, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '~/lib/supabase';

// import ActiveRideSheet from '~/components/ActiveRideSheet';
// import SelectedScooterSheet from '~/components/SelectedScooterSheet';

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_KEY || '');

export default function MapLubukBaja() {
  const [geojson, setGeojson] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [showStyleOptions, setShowStyleOptions] = useState(false);

  const mapStyles = [
    { name: 'Default', url: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
    { name: 'Satellite + Labels', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { name: 'Terrain', url: 'mapbox://styles/mapbox/outdoors-v12' },
  ];

  const cameraRef = useRef(null);

  const fitBoundsToGeojson = (geojson) => {
    if (!cameraRef.current || !geojson || !geojson.features.length) return;

    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;

    geojson.features.forEach((feature: { geometry: { coordinates: any; type: any } }) => {
      const { coordinates, type } = feature.geometry;

      if (type === 'Polygon') {
        coordinates[0].forEach(([lng, lat]) => {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        });
      }

      if (type === 'MultiPolygon') {
        coordinates.forEach((polygon: [any, any][][]) => {
          polygon[0].forEach(([lng, lat]) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });
        });
      }
    });

    cameraRef.current.fitBounds([minLng, minLat], [maxLng, maxLat], 100);
  };

  useEffect(() => {
    const fetchGeoData = async () => {
      const { data, error } = await supabase
        .from('geo_features')
        .select('id, properties, geometry');

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      const features = data
        .filter((item) => item.geometry && item.geometry.type && item.geometry.coordinates)
        .map((item) => ({
          type: 'Feature',
          geometry: item.geometry,
          properties: {
            ...item.properties,
            feature_id: item.id,
          },
          id: item.id,
        }));

      const geo = {
        type: 'FeatureCollection',
        features,
      };

      setGeojson(geo);
      fitBoundsToGeojson(geo);
    };

    fetchGeoData();
  }, []);

  const handleFeaturePress = (event: { features: any }) => {
    const features = event.features;
    if (features && features.length > 0) {
      const feature = features[0];
      setSelectedFeature(feature.properties);
      setSelectedFeatureId(feature.id);
      setModalVisible(true);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Map', headerShown: false }} />

      <View style={{ flex: 1 }}>
        <Mapbox.MapView style={{ flex: 1 }} styleURL={mapStyle}>
          <Mapbox.Camera ref={cameraRef} zoomLevel={12} centerCoordinate={[103.964386, 1.103325]} />

          {geojson && (
            <>
              <Mapbox.ShapeSource id="polygonSource" shape={geojson} onPress={handleFeaturePress}>
                <Mapbox.FillLayer
                  id="polygonLayer"
                  style={{
                    fillColor: 'rgba(0, 122, 255, 0.3)',
                    fillOutlineColor: 'rgba(0, 122, 255, 1)',
                  }}
                />
              </Mapbox.ShapeSource>

              {selectedFeatureId && (
                <Mapbox.ShapeSource
                  id="selectedPolygonSource"
                  shape={{
                    type: 'FeatureCollection',
                    features: geojson.features.filter((f) => f.id === selectedFeatureId),
                  }}>
                  <Mapbox.FillLayer
                    id="selectedPolygonLayer"
                    style={{
                      fillColor: 'rgba(255, 0, 0, 0.4)',
                      fillOutlineColor: 'red',
                    }}
                  />
                </Mapbox.ShapeSource>
              )}
            </>
          )}
        </Mapbox.MapView>

        {/* FAB Button for Map Style */}
        <View
          style={{
            position: 'absolute',
            bottom: 90,
            right: 20,
            alignItems: 'flex-end',
          }}>
          {showStyleOptions &&
            mapStyles.map((style) => (
              <TouchableOpacity
                key={style.url}
                onPress={() => {
                  setMapStyle(style.url);
                  setShowStyleOptions(false);
                }}
                style={{
                  backgroundColor: 'white',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  elevation: 4,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 3,
                }}>
                <Text>{style.name}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            onPress={() => setShowStyleOptions(!showStyleOptions)}
            style={{
              backgroundColor: '#e91e63',
              width: 56,
              height: 56,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 6,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 5,
            }}>
            <Text style={{ color: 'white', fontSize: 24 }}>🗺️</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Detail Polygon */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: 20,
                maxHeight: '60%',
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Detail Polygon</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={{ fontSize: 16, color: 'blue' }}>Tutup</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ marginTop: 10 }}>
                {selectedFeature &&
                  Object.entries(selectedFeature).map(([key, value]) => (
                    <Text key={key} style={{ marginBottom: 6 }}>
                      {key}: {String(value)}
                    </Text>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
