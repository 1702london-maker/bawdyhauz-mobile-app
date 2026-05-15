import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormField, OptionChip, PlaceholderPanel } from "@/components/FormField";
import { LuxuryButton } from "@/components/LuxuryButton";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Body, Caption, Display, Eyebrow, SerifItalic, Title } from "@/components/Typography";
import {
  IncidentStatus,
  moderationReports,
  ReportReason,
  reportReasons,
  UserStanding,
  userStandings
} from "@/data/safety";
import { submitPostDateReview, submitSafetyReport } from "@/services/reports";
import { pickAndUploadMedia } from "@/services/media";
import { borders, fonts, palette, spacing } from "@/theme/tokens";

type SafetyView =
  | "centre"
  | "review"
  | "feedback"
  | "report"
  | "reportConfirmation"
  | "incident"
  | "standing"
  | "admin";

type ReviewDraft = {
  chemistry: number;
  communication: number;
  honestReview: string;
  overall: number;
  respect: number;
  safety: number;
  nextStep: "continue" | "pause" | "close" | "";
};

type ReportDraft = {
  details: string;
  evidenceAttached: boolean;
  evidencePath?: string;
  reason: ReportReason | "";
};

const initialReview: ReviewDraft = {
  chemistry: 0,
  communication: 0,
  honestReview: "",
  overall: 0,
  respect: 0,
  safety: 0,
  nextStep: ""
};

const initialReport: ReportDraft = {
  details: "",
  evidenceAttached: false,
  evidencePath: undefined,
  reason: ""
};

export function SafetyScreen() {
  const [view, setView] = useState<SafetyView>("centre");
  const [review, setReview] = useState<ReviewDraft>(initialReview);
  const [report, setReport] = useState<ReportDraft>(initialReport);
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>("report received");
  const [standing, setStanding] = useState<UserStanding>("clear");
  const [selectedReportId, setSelectedReportId] = useState(moderationReports[0]?.id ?? "");

  const selectedModerationReport = useMemo(
    () => moderationReports.find((item) => item.id === selectedReportId) ?? moderationReports[0],
    [selectedReportId]
  );

  const patchReview = (patch: Partial<ReviewDraft>) => {
    setReview((current) => ({ ...current, ...patch }));
  };

  const patchReport = (patch: Partial<ReportDraft>) => {
    setReport((current) => ({ ...current, ...patch }));
  };

  if (view === "review") {
    return (
      <PostDateReview
        onBack={() => setView("centre")}
        onContinue={async () => {
          await submitPostDateReview(review);
          setView("feedback");
        }}
        onPatch={patchReview}
        review={review}
      />
    );
  }

  if (view === "feedback") {
    return (
      <SafetyFeedback
        onBack={() => setView("review")}
        onReport={(reason) => {
          patchReport({ reason });
          setView("report");
        }}
        onSkip={() => setView("incident")}
      />
    );
  }

  if (view === "report") {
    return (
      <ReportUserFlow
        onBack={() => setView("feedback")}
        onPatch={patchReport}
        onSubmit={async () => {
          await submitSafetyReport({
            details: report.details,
            evidencePlaceholder: report.evidencePath,
            reason: report.reason || "other concern"
          });
          setIncidentStatus("report received");
          setStanding("flagged");
          setView("reportConfirmation");
        }}
        report={report}
      />
    );
  }

  if (view === "reportConfirmation") {
    return (
      <ReportConfirmation
        onViewIncident={() => setView("incident")}
        reason={report.reason || "other concern"}
      />
    );
  }

  if (view === "incident") {
    return (
      <IncidentStatusScreen
        onBack={() => setView("centre")}
        onNextStatus={() =>
          setIncidentStatus((current) =>
            current === "report received"
              ? "under review"
              : current === "under review"
                ? "action taken"
                : current === "action taken"
                  ? "closed"
                  : "closed"
          )
        }
        status={incidentStatus}
      />
    );
  }

  if (view === "standing") {
    return (
      <UserStandingScreen
        onBack={() => setView("centre")}
        onSetStanding={setStanding}
        standing={standing}
      />
    );
  }

  if (view === "admin") {
    return (
      <AdminModerationPlaceholder
        onBack={() => setView("centre")}
        onSelectReport={setSelectedReportId}
        reportId={selectedReportId}
        selectedReport={selectedModerationReport}
      />
    );
  }

  return (
    <SafetyCentre
      onOpenAdmin={() => setView("admin")}
      onOpenIncident={() => setView("incident")}
      onOpenReview={() => setView("review")}
      onOpenStanding={() => setView("standing")}
    />
  );
}

function SafetyCentre({
  onOpenAdmin,
  onOpenIncident,
  onOpenReview,
  onOpenStanding
}: {
  onOpenAdmin: () => void;
  onOpenIncident: () => void;
  onOpenReview: () => void;
  onOpenStanding: () => void;
}) {
  return (
    <View>
      <Eyebrow>Reviews, Safety & Moderation</Eyebrow>
      <Display style={styles.title}>Protective</Display>
      <SerifItalic style={styles.italic}>and human-led.</SerifItalic>
      <Body style={styles.copy}>
        BAWDYHAUZ safety is designed to feel calm, private and serious. Reports are reviewed by a
        human team, with discretion and member protection at the centre.
      </Body>

      <LuxuryCard style={styles.card}>
        <Title style={styles.cardTitle}>Safety centre</Title>
        <Body>Consent guidance, date safety guidance, privacy guidance and investigation policy.</Body>
        <View style={styles.divider} />
        <Body>
          Emergency disclaimer: if there is immediate danger, contact local emergency services
          first. BAWDYHAUZ review tools are not emergency response systems.
        </Body>
      </LuxuryCard>

      <View style={styles.actions}>
        <LuxuryButton onPress={onOpenReview}>Post-date review</LuxuryButton>
        <LuxuryButton variant="outline" onPress={onOpenIncident}>
          Incident status
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={onOpenStanding}>
          User standing
        </LuxuryButton>
        <LuxuryButton variant="outline" onPress={onOpenAdmin}>
          Moderation placeholder
        </LuxuryButton>
      </View>
    </View>
  );
}

function PostDateReview({
  onBack,
  onContinue,
  onPatch,
  review
}: {
  onBack: () => void;
  onContinue: () => void;
  onPatch: (patch: Partial<ReviewDraft>) => void;
  review: ReviewDraft;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to safety
      </LuxuryButton>
      <Eyebrow>Post-date review</Eyebrow>
      <Display style={styles.title}>Private</Display>
      <SerifItalic style={styles.italic}>feedback.</SerifItalic>
      <Body style={styles.copy}>
        After a completed date, both members submit private feedback. This local form is a
        placeholder for future secure review handling.
      </Body>

      <LuxuryCard style={styles.card}>
        <RatingRow label="Respect" value={review.respect} onChange={(respect) => onPatch({ respect })} />
        <RatingRow
          label="Communication"
          value={review.communication}
          onChange={(communication) => onPatch({ communication })}
        />
        <RatingRow label="Safety" value={review.safety} onChange={(safety) => onPatch({ safety })} />
        <RatingRow
          label="Chemistry"
          value={review.chemistry}
          onChange={(chemistry) => onPatch({ chemistry })}
        />
        <RatingRow label="Overall" value={review.overall} onChange={(overall) => onPatch({ overall })} />
        <FormField
          label="Written honest review"
          placeholder="What should the review team understand?"
          value={review.honestReview}
          onChangeText={(honestReview) => onPatch({ honestReview })}
          multiline
        />
        <Caption>Connection next step</Caption>
        <View style={styles.chips}>
          {(["continue", "pause", "close"] as const).map((step) => (
            <OptionChip
              key={step}
              selected={review.nextStep === step}
              onPress={() => onPatch({ nextStep: step })}
            >
              {step}
            </OptionChip>
          ))}
        </View>
      </LuxuryCard>

      <LuxuryButton onPress={onContinue}>Continue to safety feedback</LuxuryButton>
    </View>
  );
}

function SafetyFeedback({
  onBack,
  onReport,
  onSkip
}: {
  onBack: () => void;
  onReport: (reason: ReportReason) => void;
  onSkip: () => void;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to review
      </LuxuryButton>
      <Eyebrow>Safety feedback</Eyebrow>
      <Display style={styles.title}>Did anything</Display>
      <SerifItalic style={styles.italic}>make you uncomfortable?</SerifItalic>
      <Body style={styles.copy}>
        Select a discreet concern category if something needs human review.
      </Body>

      <LuxuryCard style={styles.card}>
        <View style={styles.chips}>
          {reportReasons.map((reason) => (
            <OptionChip key={reason} onPress={() => onReport(reason)}>
              {reason}
            </OptionChip>
          ))}
        </View>
      </LuxuryCard>

      <LuxuryButton variant="outline" onPress={onSkip}>
        Nothing to report
      </LuxuryButton>
    </View>
  );
}

function ReportUserFlow({
  onBack,
  onPatch,
  onSubmit,
  report
}: {
  onBack: () => void;
  onPatch: (patch: Partial<ReportDraft>) => void;
  onSubmit: () => void;
  report: ReportDraft;
}) {
  const [uploading, setUploading] = useState(false);
  const uploadEvidence = async () => {
    setUploading(true);
    const result = await pickAndUploadMedia({
      bucket: "report-evidence",
      kind: "safety-report",
      mediaType: "all"
    });
    setUploading(false);
    if (result.data?.path) {
      onPatch({ evidenceAttached: true, evidencePath: result.data.path });
    }
  };

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to feedback
      </LuxuryButton>
      <Eyebrow>Report user</Eyebrow>
      <Display style={styles.title}>Private</Display>
      <SerifItalic style={styles.italic}>incident report.</SerifItalic>
      <Body style={styles.copy}>
        Add details for the moderation team. Evidence is stored privately for human review.
      </Body>

      <LuxuryCard style={styles.card}>
        <Caption>Reason</Caption>
        <View style={styles.chips}>
          {reportReasons.map((reason) => (
            <OptionChip
              key={reason}
              selected={report.reason === reason}
              onPress={() => onPatch({ reason })}
            >
              {reason}
            </OptionChip>
          ))}
        </View>
        <FormField
          label="Details"
          placeholder="Describe what happened privately and clearly"
          value={report.details}
          onChangeText={(details) => onPatch({ details })}
          multiline
        />
        <PlaceholderPanel
          label="Evidence"
          title={report.evidenceAttached ? "Evidence attached" : "Attach screenshots or notes"}
          copy="Evidence is protected and only available to the reporter and authorised reviewers."
        />
        <LuxuryButton
          arrowDirection="none"
          variant={report.evidenceAttached ? "solid" : "outline"}
          onPress={uploadEvidence}
        >
          {uploading ? "Uploading" : report.evidenceAttached ? "Replace evidence" : "Upload evidence"}
        </LuxuryButton>
      </LuxuryCard>

      <LuxuryButton disabled={!report.reason} onPress={onSubmit}>
        Submit report
      </LuxuryButton>
    </View>
  );
}

function ReportConfirmation({
  onViewIncident,
  reason
}: {
  onViewIncident: () => void;
  reason: ReportReason;
}) {
  return (
    <View>
      <Eyebrow>Report confirmation</Eyebrow>
      <Display style={styles.title}>Report received</Display>
      <SerifItalic style={styles.italic}>under private review.</SerifItalic>
      <Body style={styles.copy}>
        Your report for {reason} has been recorded locally. Future builds will route this to a
        human moderation queue.
      </Body>
      <LuxuryButton onPress={onViewIncident}>View incident status</LuxuryButton>
    </View>
  );
}

function IncidentStatusScreen({
  onBack,
  onNextStatus,
  status
}: {
  onBack: () => void;
  onNextStatus: () => void;
  status: IncidentStatus;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to safety
      </LuxuryButton>
      <Eyebrow>Incident status</Eyebrow>
      <Display style={styles.title}>Case status</Display>
      <SerifItalic style={styles.italic}>{status}.</SerifItalic>
      <Body style={styles.copy}>
        Statuses are placeholders: report received, under review, action taken and closed.
      </Body>
      <PlaceholderPanel
        label="Investigation policy"
        title="Human-led review"
        copy="BAWDYHAUZ reviews incident context discreetly before any member action is taken."
        style={styles.card}
      />
      <LuxuryButton onPress={onNextStatus}>Advance placeholder status</LuxuryButton>
    </View>
  );
}

function UserStandingScreen({
  onBack,
  onSetStanding,
  standing
}: {
  onBack: () => void;
  onSetStanding: (standing: UserStanding) => void;
  standing: UserStanding;
}) {
  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to safety
      </LuxuryButton>
      <Eyebrow>User standing</Eyebrow>
      <Display style={styles.title}>Standing</Display>
      <SerifItalic style={styles.italic}>{standing}.</SerifItalic>
      <Body style={styles.copy}>
        Placeholder states for internal safety handling. No automated enforcement is connected.
      </Body>
      <View style={styles.chips}>
        {userStandings.map((item) => (
          <OptionChip key={item} selected={standing === item} onPress={() => onSetStanding(item)}>
            {item}
          </OptionChip>
        ))}
      </View>
    </View>
  );
}

function AdminModerationPlaceholder({
  onBack,
  onSelectReport,
  reportId,
  selectedReport
}: {
  onBack: () => void;
  onSelectReport: (reportId: string) => void;
  reportId: string;
  selectedReport: (typeof moderationReports)[number];
}) {
  const [action, setAction] = useState("");

  return (
    <View>
      <LuxuryButton arrowDirection="left" variant="ghost" onPress={onBack}>
        Back to safety
      </LuxuryButton>
      <Eyebrow>Admin moderation placeholder</Eyebrow>
      <Display style={styles.title}>Report queue</Display>
      <SerifItalic style={styles.italic}>human review.</SerifItalic>
      <Body style={styles.copy}>
        Local-only queue preview. There is no admin authentication, real banning or automated
        enforcement in this phase.
      </Body>

      <LuxuryCard style={styles.card}>
        <Caption>Report queue</Caption>
        <View style={styles.chips}>
          {moderationReports.map((report) => (
            <OptionChip
              key={report.id}
              selected={reportId === report.id}
              onPress={() => onSelectReport(report.id)}
            >
              {report.id}
            </OptionChip>
          ))}
        </View>
        <View style={styles.divider} />
        <Title style={styles.cardTitle}>{selectedReport.memberName}</Title>
        <Body>{selectedReport.summary}</Body>
        <Body>Reason: {selectedReport.reason}</Body>
        <Body>Status: {selectedReport.status}</Body>
        <Body>User history placeholder: prior reports and notes will appear here.</Body>
        <Body>Trust score placeholder: {selectedReport.trustScore}/100</Body>
      </LuxuryCard>

      <LuxuryCard style={styles.card}>
        <Caption>Moderation actions</Caption>
        <View style={styles.chips}>
          {["warn", "restrict", "suspend", "ban", "close case"].map((item) => (
            <OptionChip key={item} selected={action === item} onPress={() => setAction(item)}>
              {item}
            </OptionChip>
          ))}
        </View>
        <PlaceholderPanel
          label="Selected action"
          title={action || "No action selected"}
          copy="Actions are placeholders only and do not affect any account."
        />
      </LuxuryCard>
    </View>
  );
}

function RatingRow({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <View style={styles.ratingRow}>
      <Caption>{label}</Caption>
      <View style={styles.ratingOptions}>
        {[1, 2, 3, 4, 5].map((score) => (
          <OptionChip key={score} selected={value === score} onPress={() => onChange(score)}>
            {score}
          </OptionChip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  card: {
    marginBottom: spacing.md
  },
  cardTitle: {
    marginBottom: spacing.sm
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm
  },
  copy: {
    color: palette.silver,
    marginBottom: spacing.xl,
    marginTop: spacing.lg
  },
  divider: {
    backgroundColor: borders.hairline,
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg
  },
  italic: {
    fontSize: 38,
    lineHeight: 46
  },
  ratingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  ratingRow: {
    marginBottom: spacing.lg
  },
  title: {
    fontSize: 48,
    lineHeight: 56,
    marginTop: spacing.xl
  }
});
