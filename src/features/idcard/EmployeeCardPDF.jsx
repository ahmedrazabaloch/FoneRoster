import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import {
  ADDRESS_LINES,
  EMERGENCY_CONTACT,
  getCardDetails,
} from "./idCardConstants";

Font.register({
  family: "Barlow",
  fonts: [
    { src: "/src/assets/fonts/Barlow-Regular.ttf" },
    { src: "/src/assets/fonts/Barlow-Bold.ttf", fontWeight: 700 },
  ],
});

// ── CR80 exact dimensions ─────────────────────────────────────────
// 54mm × 85.6mm  ·  1mm = 2.83465pt
const CR80_W_PT = 153.07; // 54   × 2.83465
const CR80_H_PT = 242.53; // 85.6 × 2.83465

// ── Resolve Vite asset imports to absolute URL strings ────────────
// Vite may return either a raw string or a default-export object.
function resolveAsset(imported) {
  if (typeof imported === "string") return imported;
  if (imported && typeof imported.default === "string") return imported.default;
  return imported;
}

// ── Colors ────────────────────────────────────────────────────────
const C = {
  red: "#e52d3c",
  darkText: "#1a1a1a",
  midText: "#444444",
  lightText: "#666666",
  mutedText: "#999999",
  fieldLabel: "#1a1a1a",
  fieldValue: "#333333",
  white: "#ffffff",
  divider: "rgba(0,0,0,0.15)",
  photoBg: "#f0f0f0",
};

// ── Styles ────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    width: CR80_W_PT,
    height: CR80_H_PT,
    position: "relative",
  },

  // ─ shared ─
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CR80_W_PT,
    height: CR80_H_PT,
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CR80_W_PT,
    height: CR80_H_PT,
  },

  // ─ front ─
  frontContent: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
  },
  logo: {
    width: 76,
    height: 24,
    objectFit: "contain",
  },
  photoFrame: {
    marginTop: 8,
    width: 76,
    height: 82,
    borderRadius: 5,
    border: "1.5pt solid #fff",
    overflow: "hidden",
    backgroundColor: C.photoBg,
    position: "relative",
  },

  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderText: {
    fontSize: 18,
    color: "#B8B8B8",
    fontFamily: "Barlow",
  },
  infoBlock: {
    marginTop: 7,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  },
  nameText: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 10,
    color: C.darkText,
    textAlign: "center",
    maxLines: 1,
  },
  designationText: {
    fontFamily: "Barlow",
    fontStyle: "italic",
    fontSize: 7.5,
    color: C.lightText,
    textAlign: "center",
    maxLines: 1,
  },
  employeeIdText: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 7,
    color: C.midText,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  projectBadge: {
    marginTop: 7,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: C.red,
    borderRadius: 3,
  },
  projectBadgeText: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 5.5,
    color: C.white,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  bottomRow: {
    marginTop: "auto",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrContainer: {
    backgroundColor: C.white,
    padding: 2,
    borderRadius: 2,
  },
  qrImage: {
    width: 28,
    height: 28,
  },
  signatureBlock: {
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  signatureName: {
    fontFamily: "Courier",
    fontWeight: 600,
    fontSize: 9,
    color: "#2a2a2a",
  },
  signatureLine: {
    width: 46,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
  },
  signatureLabel: {
    fontFamily: "Barlow",
    fontSize: 4.5,
    color: C.mutedText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ─ back ─
  backContent: {
    flex: 1,
    flexDirection: "column",
  },
  backHeader: {
    backgroundColor: C.red,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backHeaderText: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 7,
    color: C.white,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  fieldsContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 5,
    gap: 5,
  },
  fieldGroup: {
    flexDirection: "column",
    gap: 0,
  },
  fieldLabel: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 8,
    color: C.fieldLabel,
    lineHeight: 1.3,
  },
  fieldValue: {
    fontFamily: "Barlow",
    fontSize: 8.5,
    color: C.fieldValue,
    lineHeight: 1.3,
  },
  backDivider: {
    marginHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#D1D5DB",
  },
  backFooter: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 2,
  },
  backLogo: {
    width: 62,
    height: 19,
    objectFit: "contain",
  },
  addressText: {
    fontFamily: "Barlow",
    fontWeight: 700,
    fontSize: 6,
    color: "#333333",
    textAlign: "center",
    lineHeight: 1.2,
  },
});

// ── Front Side ────────────────────────────────────────────────────

const PHOTO_W = 76;
const PHOTO_H = 82;

const CardFrontPage = ({ details, qrDataUrl, logoSrc, frontBgSrc, photoPosition }) => {
  const px = photoPosition?.x ?? 50;
  const py = photoPosition?.y ?? 50;
  const ps = photoPosition?.scale ?? 1;

  return (
  <Page size={[CR80_W_PT, CR80_H_PT]} style={s.page}>
    {/* Background */}
    {frontBgSrc && <Image src={frontBgSrc} style={s.bgImage} />}

    {/* Content overlay */}
    <View style={[s.contentOverlay, s.frontContent]}>
      {/* Logo */}
      {logoSrc && <Image src={logoSrc} style={s.logo} />}

      {/* Employee Photo */}
      <View style={s.photoFrame}>
        {details.photoUrl ? (
          <Image
            src={details.photoUrl}
            style={{
              position: "absolute",
              height: `${ps * 100}%`,
              width: "auto",
              left: `${px}%`,
              top: `${py}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ) : (
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>?</Text>
          </View>
        )}
      </View>

      {/* Name / Designation / Employee ID */}
      <View style={s.infoBlock}>
        <Text style={s.nameText}>{details.name}</Text>
        <Text style={s.designationText}>{details.designation}</Text>
        <Text style={s.employeeIdText}>
          Employee ID: {details.employeeId}
        </Text>
      </View>

      {/* Project Badge */}
      <View style={s.projectBadge}>
        <Text style={s.projectBadgeText}>Zong Fuel Logistics Project</Text>
      </View>

      {/* QR + Signature row */}
      <View style={s.bottomRow}>
        {/* QR Code */}
        <View style={s.qrContainer}>
          {qrDataUrl && <Image src={qrDataUrl} style={s.qrImage} />}
        </View>

        {/* Signature block */}
        <View style={s.signatureBlock}>
          <Text style={s.signatureName}>Formula One</Text>
          <View style={s.signatureLine} />
          <Text style={s.signatureLabel}>Authorized By</Text>
        </View>
      </View>
    </View>
  </Page>
  );
};

// ── Back Side ─────────────────────────────────────────────────────

const CardBackPage = ({ details, logoSrc, backBgSrc }) => {
  const fields = [
    { label: "Father Name", value: details.fatherName },
    { label: "CNIC", value: details.cnic },
    { label: "License", value: details.license },
    { label: "Blood Group", value: details.bloodGroup },
    { label: "Emergency Contact", value: EMERGENCY_CONTACT },
  ];

  return (
    <Page size={[CR80_W_PT, CR80_H_PT]} style={s.page}>
      {/* Background */}
      {backBgSrc && <Image src={backBgSrc} style={s.bgImage} />}

      {/* Content overlay */}
      <View style={[s.contentOverlay, s.backContent]}>
        {/* Header banner */}
        <View style={s.backHeader}>
          <Text style={s.backHeaderText}>Personal Details</Text>
        </View>

        {/* Fields */}
        <View style={s.fieldsContainer}>
          {fields.map((f) => (
            <View key={f.label} style={s.fieldGroup}>
              <Text style={s.fieldLabel}>{f.label}:</Text>
              <Text style={s.fieldValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={s.backDivider} />

        {/* Footer — logo + address */}
        <View style={s.backFooter}>
          {logoSrc && <Image src={logoSrc} style={s.backLogo} />}
          {ADDRESS_LINES.map((line) => (
            <Text key={line} style={s.addressText}>
              {line}
            </Text>
          ))}
        </View>
      </View>
    </Page>
  );
};

// ── Document ──────────────────────────────────────────────────────

export const EmployeeCardPDF = ({
  employee,
  qrDataUrl,
  logoSrc,
  frontBgSrc,
  backBgSrc,
  photoPosition,
}) => {
  const details = getCardDetails(employee);

  return (
    <Document
      title={`ID Card - ${details.name}`}
      author="Formula One"
      creator="FoneRoster"
    >
      <CardFrontPage
        details={details}
        qrDataUrl={qrDataUrl}
        logoSrc={logoSrc}
        frontBgSrc={frontBgSrc}
        photoPosition={photoPosition}
      />
      <CardBackPage
        details={details}
        logoSrc={logoSrc}
        backBgSrc={backBgSrc}
      />
    </Document>
  );
};
