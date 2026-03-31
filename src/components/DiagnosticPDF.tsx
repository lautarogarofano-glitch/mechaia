import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VehicleData, Message } from '../types/vehicle';

const blue = '#3B5BDB';
const lightBlue = '#EEF2FF';
const dark = '#1E293B';
const mid = '#475569';
const light = '#94A3B8';
const border = '#E2E8F0';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', paddingBottom: 80 },

  // Header
  header: { backgroundColor: blue, paddingHorizontal: 32, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  headerSub: { color: '#C7D2FE', fontSize: 9, marginTop: 2 },
  headerDate: { color: '#C7D2FE', fontSize: 8, textAlign: 'right' },

  // Workshop
  workshopBand: { backgroundColor: lightBlue, paddingHorizontal: 32, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: border },
  workshopName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: blue },
  workshopLabel: { fontSize: 8, color: light, marginBottom: 2 },

  // Body
  body: { paddingHorizontal: 32, paddingTop: 24 },

  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20 },
  divider: { height: 1, backgroundColor: border, marginBottom: 12 },

  // Vehicle info grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '30%', backgroundColor: '#F8FAFC', borderRadius: 4, padding: 8, borderWidth: 1, borderColor: border },
  gridLabel: { fontSize: 7, color: light, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: dark },

  // Falla box
  fallaBox: { backgroundColor: '#FFF7ED', borderLeftWidth: 3, borderLeftColor: '#F97316', padding: 12, borderRadius: 4 },
  fallaLabel: { fontSize: 7, color: '#9A3412', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fallaText: { fontSize: 10, color: '#7C2D12', fontFamily: 'Helvetica-Bold' },

  // Conversation
  msgAI: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: border, borderRadius: 6, padding: 10, marginBottom: 8 },
  msgUser: { backgroundColor: lightBlue, borderRadius: 6, padding: 10, marginBottom: 8, marginLeft: 20 },
  msgRole: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  msgRoleAI: { color: blue },
  msgRoleUser: { color: mid },
  msgText: { fontSize: 9, color: dark, lineHeight: 1.5 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: border, paddingHorizontal: 32, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  footerText: { fontSize: 7, color: light },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: blue },
  qrImage: { width: 48, height: 48 },
});

interface Props {
  vehicle: VehicleData;
  messages: Message[];
  workshopName: string;
  qrDataUrl: string;
}

export function DiagnosticPDF({ vehicle, messages, workshopName, qrDataUrl }: Props) {
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  // Solo mensajes con contenido real (excluir errores)
  const filteredMessages = messages.filter(m => m.content && !m.content.startsWith('Error:'));

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>MechaIA</Text>
            <Text style={styles.headerSub}>Informe de Diagnóstico Automotriz</Text>
          </View>
          <View>
            <Text style={styles.headerDate}>{fecha}</Text>
            <Text style={styles.headerDate}>{hora} hs</Text>
          </View>
        </View>

        {/* Workshop band */}
        <View style={styles.workshopBand}>
          <Text style={styles.workshopLabel}>Taller</Text>
          <Text style={styles.workshopName}>{workshopName || 'Sin nombre de taller'}</Text>
        </View>

        <View style={styles.body}>

          {/* Datos del vehículo */}
          <Text style={styles.sectionTitle}>Datos del vehículo</Text>
          <View style={styles.divider} />
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Patente</Text>
              <Text style={styles.gridValue}>{vehicle.patente.toUpperCase()}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Marca</Text>
              <Text style={styles.gridValue}>{vehicle.marca}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Modelo</Text>
              <Text style={styles.gridValue}>{vehicle.modelo}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Año</Text>
              <Text style={styles.gridValue}>{vehicle.año}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Motor</Text>
              <Text style={styles.gridValue}>{vehicle.motor}</Text>
            </View>
            {vehicle.ecu ? (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>ECU</Text>
                <Text style={styles.gridValue}>{vehicle.ecu}</Text>
              </View>
            ) : null}
            {vehicle.kilometraje ? (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Kilometraje</Text>
                <Text style={styles.gridValue}>{vehicle.kilometraje} km</Text>
              </View>
            ) : null}
            {vehicle.codigoObd ? (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Código OBD2</Text>
                <Text style={styles.gridValue}>{vehicle.codigoObd}</Text>
              </View>
            ) : null}
          </View>

          {/* Falla reportada */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Falla reportada</Text>
          <View style={styles.divider} />
          <View style={styles.fallaBox}>
            <Text style={styles.fallaLabel}>Descripción del problema</Text>
            <Text style={styles.fallaText}>{vehicle.falla}</Text>
          </View>

          {/* Diagnóstico */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Diagnóstico</Text>
          <View style={styles.divider} />
          {filteredMessages.map((msg, i) => (
            <View key={i} style={msg.role === 'assistant' ? styles.msgAI : styles.msgUser}>
              <Text style={[styles.msgRole, msg.role === 'assistant' ? styles.msgRoleAI : styles.msgRoleUser]}>
                {msg.role === 'assistant' ? 'MechaIA' : 'Mecánico'}
              </Text>
              <Text style={styles.msgText}>{msg.content}</Text>
            </View>
          ))}

        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerBrand}>MechaIA · Diagnóstico Automotriz con IA</Text>
            <Text style={styles.footerText}>Este informe fue generado con inteligencia artificial. Verificar recomendaciones con un profesional.</Text>
          </View>
          {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImage} /> : null}
        </View>

      </Page>
    </Document>
  );
}
