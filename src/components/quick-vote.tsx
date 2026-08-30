"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircleIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { VoteModal } from "@/components/vote-modal";
import { hasVotedLocally } from "@/lib/fingerprint";
import type { PublicProject } from "@/lib/types";

export function QuickVote({ project, votingOpen }: { project: PublicProject; votingOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [voted, setVoted] = useState(false);
  const close = useCallback(() => { setOpen(false); setVoted(hasVotedLocally()); }, []);

  useEffect(() => { setVoted(hasVotedLocally()); }, []);

  return (
    <>
      {voted ? (
        <span className="badge badge-voted"><CheckCircleIcon />Sudah voting</span>
      ) : (
        <button className="button button-primary" type="button" onClick={() => setOpen(true)} disabled={!votingOpen}>
          <RocketLaunchIcon />{votingOpen ? "Vote proyek ini" : "Voting ditutup"}
        </button>
      )}
      <VoteModal project={open ? project : null} onClose={close} />
    </>
  );
}
