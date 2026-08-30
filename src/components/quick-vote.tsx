"use client";

import { useCallback, useState } from "react";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { VoteModal } from "@/components/vote-modal";
import type { PublicProject } from "@/lib/types";

export function QuickVote({ project, votingOpen }: { project: PublicProject; votingOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button className="button button-primary" type="button" onClick={() => setOpen(true)} disabled={!votingOpen}>
        <RocketLaunchIcon />{votingOpen ? "Vote proyek ini" : "Voting ditutup"}
      </button>
      <VoteModal project={open ? project : null} onClose={close} />
    </>
  );
}

