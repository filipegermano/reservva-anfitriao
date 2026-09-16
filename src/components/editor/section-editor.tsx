"use client";

import type { GuideSectionData } from "@/lib/guide/data";
import { isInfoListType, type SectionContent } from "@/lib/guide/sections";
import { AboutEditor } from "@/components/editor/sections/about-editor";
import { FeedbackEditor, type ReceivedFeedback } from "@/components/editor/sections/feedback-editor";
import { HostEditor } from "@/components/editor/sections/host-editor";
import { NearbyEditor } from "@/components/editor/sections/nearby-editor";
import { RoomsEditor } from "@/components/editor/sections/rooms-editor";
import {
  AmenitiesEditor,
  CheckinEditor,
  EmergencyEditor,
  InfoListEditor,
  RulesEditor,
  WifiEditor,
} from "@/components/editor/sections/simple-editors";

/** Escolhe o formulário certo para o tipo da seção. */
export function SectionEditor({
  section,
  onChange,
  feedbacks,
}: {
  section: GuideSectionData;
  onChange: (content: SectionContent) => void;
  feedbacks: ReceivedFeedback[];
}) {
  if (isInfoListType(section.type)) {
    return (
      <InfoListEditor content={section.content as SectionContent<"transport">} onChange={onChange} />
    );
  }

  switch (section.type) {
    case "host":
      return <HostEditor content={section.content} onChange={onChange} />;
    case "about":
      return <AboutEditor content={section.content} onChange={onChange} />;
    case "rooms":
      return <RoomsEditor content={section.content} onChange={onChange} />;
    case "wifi":
      return <WifiEditor content={section.content} onChange={onChange} />;
    case "amenities":
      return <AmenitiesEditor content={section.content} onChange={onChange} />;
    case "rules":
      return <RulesEditor content={section.content} onChange={onChange} />;
    case "emergency":
      return <EmergencyEditor content={section.content} onChange={onChange} />;
    case "checkin":
      return <CheckinEditor content={section.content} onChange={onChange} />;
    case "local_tips":
    case "restaurants":
      return <NearbyEditor type={section.type} content={section.content} onChange={onChange} />;
    case "feedback":
      return <FeedbackEditor content={section.content} onChange={onChange} feedbacks={feedbacks} />;
    default:
      return null;
  }
}
