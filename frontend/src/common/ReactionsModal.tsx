import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../auth/CrossOrigin";
import "./Modal.css";
import { Heart, Smile, ThumbsUp, Zap } from "lucide-react";

interface User {
  id: string;
  username: string;
  fname: string;
  lname: string;
  avatar: string | null;
}

interface Reaction {
  id: string;
  reactionType: string;
  user: User;
}

interface ReactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoId: string;
  token: string;
  endpoint?: string;
}

const iconForType = (type: string) => {
  switch ((type || "").toLowerCase()) {
    case "heart":
    case "love":
      return <Heart size={18} />;
    case "smile":
    case "laugh":
      return <Smile size={18} />;
    case "thumbsup":
    case "like":
      return <ThumbsUp size={18} />;
    case "zap":
    case "wow":
      return <Zap size={18} />;
    default:
      return <Heart size={18} />; // fallback
  }
};

const ReactionsModal: React.FC<ReactionsModalProps> = ({
  isOpen,
  onClose,
  photoId,
  token,
  endpoint = "/api/reactions"
}) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReactions();
    } else {
      // reset when closed (optional)
      setReactions([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, photoId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // endpoint shape expected: GET /api/photo/:photoId/likes
      // response shape expected: { reactions: { likes: [ { id, reactionType, user: {...} }, ... ], likesCount, ... } }
      const url = `${endpoint}/${photoId}`;
      const resp = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      // tolerate various response shapes
      const payload = resp.data?.reactions ?? resp.data?.photo ?? resp.data;
      const likesArray: Reaction[] =
        Array.isArray(payload?.likes) ? payload.likes : Array.isArray(payload) ? payload : [];

      // normalize: ensure each like has user and reactionType
      const normalized = likesArray.map((l: any) => ({
        id: l.id,
        reactionType: l.reactionType ?? l.type ?? "like",
        user: l.user ?? l // fallback if payload is user directly
      })) as Reaction[];

      setReactions(normalized);
    } catch (err: any) {
      console.error("Failed to fetch reactions", err);
      setError("Failed to load reactions");
    } finally {
      setLoading(false);
    }
  };

  // counts per reaction type
  const counts = reactions.reduce<Record<string, number>>((acc, r) => {
    const key = (r.reactionType || "like").toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const totalCount = reactions.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{
              background: "rgba(0, 0, 0, 0.69)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-50 blurred-card p-4"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              maxWidth: "520px",
              width: "92%",
              maxHeight: "72vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
            initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <button
              className="position-absolute top-0 end-0 m-3 btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />

            {/* Header with counts */}
            <div style={{ marginBottom: 12, textAlign: "center" }}>
              <h3 className="text-white mb-1">Reactions</h3>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
                <div style={{ color: "white", fontSize: 13 }}>
                  <Heart size={14} /> <strong style={{ marginLeft: 6 }}>{counts["heart"] || counts["love"] || 0}</strong>
                </div>
                <div style={{ color: "white", fontSize: 13 }}>
                  <ThumbsUp size={14} /> <strong style={{ marginLeft: 6 }}>{counts["like"] || counts["thumbsup"] || 0}</strong>
                </div>
                <div style={{ color: "white", fontSize: 13 }}>
                  <Smile size={14} /> <strong style={{ marginLeft: 6 }}>{counts["smile"] || counts["laugh"] || 0}</strong>
                </div>
                <div style={{ color: "white", fontSize: 13 }}>
                  <Zap size={14} /> <strong style={{ marginLeft: 6 }}>{counts["zap"] || counts["wow"] || 0}</strong>
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                  Total: <strong style={{ marginLeft: 6 }}>{totalCount}</strong>
                </div>
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading && <p className="text-center text-white-50">Loading...</p>}
              {!loading && error && <p className="text-center text-danger">{error}</p>}

              {!loading && !error && reactions.length === 0 && (
                <p className="text-center text-white-50">No reactions yet</p>
              )}

              {!loading && reactions.map((r) => (
                <div
                  key={r.id}
                  className="d-flex align-items-center gap-3 p-2 mb-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    borderRadius: 10,
                    cursor: "default",
                    transition: "background 0.15s"
                  }}
                >
                  <img
                    src={r.user.avatar || "/stock-profile-pic.png"}
                    alt={r.user.username}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p className="mb-0 text-white fw-bold">{r.user.fname} {r.user.lname}</p>
                    <p className="mb-0 text-white-50 small">@{r.user.username}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ color: "white", display: "flex", alignItems: "center" }}>
                      {iconForType(r.reactionType)}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                      {r.reactionType}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReactionsModal;