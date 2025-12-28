import React from "react";
import MatchAnalysisSidebar from "../components/MatchAnalysisSidebar";

/**
 * MatchAnalysisModule
 * 
 * Pure wrapper for the match analysis sidebar section.
 * No logic - just composition and prop forwarding.
 * 
 * @param {Object} props - All props passed through to MatchAnalysisSidebar
 */
export default function MatchAnalysisModule(props) {
  return <MatchAnalysisSidebar {...props} />;
}

