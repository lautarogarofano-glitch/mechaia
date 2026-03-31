import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VehicleData } from '../types/vehicle';
import type { ReportData } from './ReportModal';

const dark = '#0F172A';
const mid = '#475569';
const light = '#94A3B8';
const border = '#E2E8F0';
const bg = '#F8FAFC';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 72,
  },

  // Header
  header: { marginBottom: 28 },
  workshopName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: dark, marginBottom: 4 },
  headerMeta: { fontSize: 9, color: light },

  dividerThick: { height: 2, backgroundColor: dark, marginBottom: 20 },
  dividerThin: { height: 1, backgroundColor: border, marginBottom: 14 },

  // Título del documento
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: dark, marginBottom: 4 },
  docSubtitle: { fontSize: 9, color: mid, marginBottom: 20 },

  // Sección
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: mid,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 18,
  },

  // Grid vehículo
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33.33%', marginBottom: 10 },
  gridLabel: { fontSize: 7, color: light, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: dark },

  // Falla
  fallaBox: {
    backgroundColor: bg,
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: border,
    marginBottom: 4,
  },
  fallaText: { fontSize: 10, color: dark, lineHeight: 1.6 },

  // Diagnóstico / Trabajos / Observaciones
  contentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: border,
    marginBottom: 4,
  },
  contentText: { fontSize: 10, color: dark, lineHeight: 1.7 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: { flex: 1 },
  footerLine: { height: 1, backgroundColor: border, marginBottom: 10 },
  footerText: { fontSize: 7, color: light, lineHeight: 1.6 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrImage: { width: 44, height: 44 },
  mechaiaLabel: { fontSize: 7, color: light, textAlign: 'right' },
});

interface Props {
  vehicle: VehicleData;
  reportData: ReportData;
  workshopName: string;
  qrDataUrl: string;
}

export function DiagnosticPDF({ vehicle, reportData, workshopName, qrDataUrl }: Props) {
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Encabezado del taller */}
        <View style={styles.header}>
          <Text style={styles.workshopName}>{workshopName}</Text>
          <Text style={styles.headerMeta}>{fecha}</Text>
        </View>

        <View style={styles.dividerThick} />

        {/* Título del documento */}
        <Text style={styles.docTitle}>Informe de Diagnóstico Vehicular</Text>
        <Text style={styles.docSubtitle}>
          {vehicle.marca} {vehicle.modelo} {vehicle.año} · Patente {vehicle.patente.toUpperCase()}
        </Text>

        <View style={styles.dividerThin} />

        {/* Datos del vehículo */}
        <Text style={styles.sectionTitle}>Datos del vehículo</Text>
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
              <Text style={styles.gridValue}>{Number(vehicle.kilometraje).toLocaleString('es-AR')} km</Text>
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
        <Text style={styles.sectionTitle}>Motivo de ingreso</Text>
        <View style={styles.fallaBox}>
          <Text style={styles.fallaText}>{vehicle.falla}</Text>
        </View>

        {/* Diagnóstico final */}
        <Text style={styles.sectionTitle}>Diagnóstico</Text>
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{reportData.diagnosticoFinal}</Text>
        </View>

        {/* Trabajos realizados (solo si hay) */}
        {reportData.trabajosRealizados.trim() ? (
          <>
            <Text style={styles.sectionTitle}>Trabajos realizados</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{reportData.trabajosRealizados}</Text>
            </View>
          </>
        ) : null}

        {/* Observaciones (solo si hay) */}
        {reportData.observaciones.trim() ? (
          <>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{reportData.observaciones}</Text>
            </View>
          </>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLeft}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>{workshopName}</Text>
            <Text style={styles.footerText}>Informe generado el {fecha}</Text>
          </View>
          <View style={styles.footerRight}>
            <View>
              <Text style={styles.mechaiaLabel}>Generado con</Text>
              <Text style={[styles.mechaiaLabel, { fontFamily: 'Helvetica-Bold' }]}>MechaIA</Text>
            </View>
            {qrDataUrl ? <Image src={qrDataUrl} style={styles.qrImage} /> : null}
          </View>
        </View>

      </Page>
    </Document>
  );
}
