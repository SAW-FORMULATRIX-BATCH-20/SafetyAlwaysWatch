# Safety Always Watch

Safety Always Watch (SAW) is a workplace safety monitoring product for identifying people in hazardous areas, evaluating their PPE compliance, and maintaining an auditable safety record.

## Language

**Alat Pelindung Diri (APD)**:
Equipment a person must wear to comply with the safety requirements of a hazardous area.
_Avoid_: PPE in user-facing Indonesian copy, safety gear

**Kelas APD Kanonis**:
The single human-readable APD concept to which one or more raw detection-model labels are mapped.
_Avoid_: Raw model label when referring to the configured safety concept

**Zona Berbahaya**:
A defined area within a camera's field of view that imposes specific APD requirements on anyone entering it.
_Avoid_: Area berbahaya, danger area

**Sumber Kamera**:
A configured video source that observes one or more Zona Berbahaya and reports its operational connection state.
_Avoid_: Camera device when referring to the configured source

**Karyawan**:
A person registered in SAW whose identity, department, supervisor, and safety record can be managed.
_Avoid_: Pekerja, user, account

**Orang Terdeteksi**:
A person currently tracked by SAW whose registered identity has not yet been resolved.
_Avoid_: Karyawan when identity is not known

**Tidak Dikenali**:
The identity outcome when an Orang Terdeteksi cannot be matched to a registered Karyawan.
_Avoid_: Unknown user, anonymous employee

**Kepatuhan APD**:
The condition in which an Orang Terdeteksi inside a Zona Berbahaya is wearing every APD required by that zone.
_Avoid_: Safety compliance when referring specifically to PPE

**Skor Keselamatan**:
A Karyawan's current numerical safety standing, reduced by confirmed violations and restored by a score reset.
_Avoid_: Skor Kredit Keamanan in user-facing copy, safety points

**Ambang Eskalasi**:
The configured Skor Keselamatan boundary below which responsible parties must be notified.
_Avoid_: Threshold Skor in user-facing copy

**Episode Pelanggaran**:
One continuous occurrence of missing a required APD in a Zona Berbahaya, tracked from initial candidacy until it is cleared.
_Avoid_: Violation Event, incident when referring to the full lifecycle

**Status Episode**:
The lifecycle stage of an Episode Pelanggaran: Candidate, Confirmed, Clearing, or Cleared.
_Avoid_: Status pelanggaran when the lifecycle stage is intended

**Dalam Verifikasi**:
The user-facing status for a Candidate episode that has not yet persisted long enough to become a confirmed violation.
_Avoid_: Pelanggaran before confirmation

**Pelanggaran**:
The user-facing status for an episode that has reached Confirmed and produced one auditable Peristiwa Pelanggaran.
_Avoid_: Candidate, warning

**Memulihkan**:
The user-facing status for a confirmed episode whose subject is currently compliant but has not remained compliant long enough to be cleared.
_Avoid_: Selesai

**Selesai**:
The user-facing status for a Cleared episode that remains part of the violation history.
_Avoid_: Dihapus, dibatalkan

**Peristiwa Pelanggaran**:
The auditable record created once when an Episode Pelanggaran becomes Confirmed.
_Avoid_: Episode Pelanggaran, violation frame

**Periode Skor**:
The interval over which a Karyawan's violations and Skor Keselamatan are accumulated before a reset.
_Avoid_: Reporting period when referring specifically to safety scores

**Reset Skor**:
The complete restoration of a Karyawan's Skor Keselamatan to its configured initial value, with an auditable reason and period summary.
_Avoid_: Score recovery, partial recovery

**Supervisor Area**:
The person responsible for monitoring one or more assigned zones or departments and responding to their safety events.
_Avoid_: Manager when this operational role is intended

**Admin/Safety Officer**:
The role responsible for configuring zones, APD rules, employees, notifications, and safety-score parameters.
_Avoid_: Admin when the safety responsibility matters

**HRD**:
The role responsible for reviewing aggregate compliance trends, escalations, and auditable employee safety history.
_Avoid_: Human Resources in user-facing Indonesian copy
