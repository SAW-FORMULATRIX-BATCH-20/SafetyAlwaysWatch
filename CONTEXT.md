# Safety Always Watch

Safety Always Watch (SAW) is a workplace safety monitoring product for identifying people in hazardous areas, evaluating their PPE compliance, and maintaining an auditable safety record.

## Language

**Personal Protective Equipment (PPE)**:
Equipment a person must wear to comply with the safety requirements of a Hazardous Zone.
_Avoid_: Alat Pelindung Diri, APD, safety gear

**Canonical PPE Class**:
The single human-readable PPE concept to which one or more raw detection-model labels are mapped.
_Avoid_: Kelas APD Kanonis, raw model label when referring to the configured safety concept

**Hazardous Zone**:
A defined area within a Camera Source's field of view that imposes specific PPE requirements on anyone entering it.
_Avoid_: Zona Berbahaya, danger area

**Camera Source**:
A configured video source that observes one or more Hazardous Zones and reports its operational connection state.
_Avoid_: Sumber Kamera, camera device when referring to the configured source

**Employee**:
A person registered in SAW whose identity, department, supervisor, and safety record can be managed.
_Avoid_: Karyawan, worker, user, account

**Face Enrollment**:
The process of validating a facial image and linking its derived biometric representation to an Employee for later identification.
_Avoid_: registering an Employee when referring only to their biometric sample

**Face Sample**:
One active or inactive facial reference linked to an Employee through Face Enrollment. Its raw embedding and source image are not exposed to SAW frontend users.
_Avoid_: face photo, Face Enrollment when referring to a single stored reference

**Detected Person**:
A person currently tracked by SAW whose registered identity has not yet been resolved.
_Avoid_: Orang Terdeteksi, Employee when identity is not known

**Unknown**:
The identity outcome when a Detected Person cannot be matched to a registered Employee.
_Avoid_: Tidak Dikenali, unknown user, anonymous employee

**PPE Compliance**:
The condition in which a Detected Person inside a Hazardous Zone is wearing every PPE item required by that zone.
_Avoid_: Kepatuhan APD, safety compliance when referring specifically to PPE

**Detection Confidence**:
A value from 0 to 1 expressing the model's confidence in a Detected Person or PPE detection.
_Avoid_: Keyakinan Deteksi

**Safety Score**:
An Employee's current numerical safety standing, reduced by confirmed violations and restored by a Score Reset.
_Avoid_: Skor Keselamatan, safety credit score, safety points

**Escalation Threshold**:
The configured Safety Score boundary below which responsible parties must be notified.
_Avoid_: Ambang Eskalasi, score threshold

**Violation Episode**:
One continuous occurrence of missing required PPE in a Hazardous Zone, tracked from initial candidacy until it is cleared.
_Avoid_: Episode Pelanggaran, Violation Event, incident when referring to the full lifecycle

**Episode Status**:
The lifecycle stage of a Violation Episode: Candidate, Confirmed, Clearing, or Cleared.
_Avoid_: Status Episode, violation status when the lifecycle stage is intended

**Pending Confirmation**:
The user-facing status for a Candidate episode that has not yet persisted long enough to become a confirmed violation.
_Avoid_: Dalam Verifikasi, Violation before confirmation

**Violation**:
The user-facing status for an episode that has reached Confirmed and produced one auditable Violation Event.
_Avoid_: Pelanggaran, Candidate, warning

**Clearing**:
The user-facing status for a confirmed episode whose subject is currently compliant but has not remained compliant long enough to be cleared.
_Avoid_: Memulihkan, Cleared

**Cleared**:
The user-facing status for a cleared episode that remains part of the violation history.
_Avoid_: Selesai, deleted, cancelled

**Violation Event**:
The auditable record created once when a Violation Episode becomes Confirmed.
_Avoid_: Peristiwa Pelanggaran, Violation Episode, violation frame

**Score Period**:
The interval over which an Employee's violations and Safety Score are accumulated before a reset.
_Avoid_: Periode Skor, reporting period when referring specifically to safety scores

**Score Reset**:
The complete restoration of an Employee's Safety Score to its configured initial value, with an auditable reason and period summary.
_Avoid_: Reset Skor, score recovery, partial recovery

**Area Supervisor**:
The person responsible for monitoring one or more assigned zones or departments and responding to their safety events.
_Avoid_: Supervisor Area, manager when this operational role is intended

**Admin/Safety Officer**:
The role responsible for configuring zones, PPE rules, employees, notifications, and safety-score parameters.
_Avoid_: Admin when the safety responsibility matters

**Human Resources (HR)**:
The role responsible for reviewing aggregate compliance trends, escalations, and auditable employee safety history.
_Avoid_: HRD

**Inference Worker**:
A separate service that runs AI inference (person detection, tracking, PPE detection, face detection) against camera video feeds and publishes structured detection results to the SAW backend API.
_Avoid_: Edge Worker when referring to the service contract, AI pipeline

**Identity Resolver**:
The component that matches a Detected Person's face embedding against enrolled Employee Face Samples and caches the result per track.
_Avoid_: face matcher, recognition service when referring to the per-track caching component

**Track Identity Cache**:
A singleton in-memory cache that stores resolved Employee identity per TrackId, retrying while Unknown and caching once matched, with TTL-based eviction.
_Avoid_: face cache, identity cache without the "track" qualifier

**Ingest Frame**:
The structured payload sent by the Inference Worker to the SAW backend via REST POST, containing all Detected Persons, their PPE detections, face embeddings, and lost track IDs for one camera frame.
_Avoid_: raw frame, video frame when referring to the processed detection payload

**Detection Frame Output**:
The processed payload pushed from the SAW backend to monitoring frontends via SignalR, containing identity-resolved, compliance-evaluated detection results ready for overlay rendering.
_Avoid_: SignalR event, detection event when the full processed output is intended
