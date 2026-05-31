import { CiSettings } from "react-icons/ci";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useGroup } from "../../context/GroupContext.jsx";
import { useState } from "react";
import { Modal } from "bootstrap";
import ConfirmModal from "../modals/ConfirmModal";

export default function GroupCard({
  name,
  group_id,
  color,
  description,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const { enterGroup } = useGroup();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleEnter() {
    enterGroup({ id: group_id, name, color });
    navigate(`/workspace/${group_id}`);
  }

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(group_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy group ID:", err);
    }
  }

  function openDeleteModal() {
    const modal = new Modal(document.getElementById(`delete-${group_id}`));
    modal.show();
  }

  const handleDelete = () => {
    onDelete?.(group_id);
  };

  const headerGradient = `linear-gradient(135deg, ${color}cc, ${color}99)`;

  return (
    <div
      className="card border-0 rounded-4 shadow-sm overflow-hidden h-100"
      style={{ backgroundColor: "#1e1e2f" }}
    >
      {/* Header */}
      <div
        className="position-relative"
        style={{
          height: 120,
          background: headerGradient,
        }}
      >
        {/* Settings Dropdown */}
        <div className="position-absolute top-0 end-0 m-3">
          <button
            className="btn btn-sm text-light"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <CiSettings />
          </button>

          {dropdownOpen && (
            <div
              className="position-absolute end-0 mt-2 p-2 rounded-3"
              style={{
                backgroundColor: "#2a2a3d",
                border: "1px solid #3a3a55",
                zIndex: 10,
                minWidth: 120,
              }}
            >
              {/* EDIT */}
              <div
                className="d-flex align-items-center p-1 hover-bg"
                style={{ cursor: "pointer", color: "#ffffff" }}
                onClick={() => {
                  setDropdownOpen(false);
                  onEdit?.();
                }}
              >
                <FaPen className="me-2" />
                Edit
              </div>

              {/* DELETE */}
              <div
                className="d-flex align-items-center p-1 hover-bg mt-1"
                style={{ cursor: "pointer", color: "#ffffff" }}
                onClick={() => {
                  setDropdownOpen(false);
                  openDeleteModal();
                }}
              >
                <MdDelete className="me-2" />
                Delete
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body d-flex flex-column" style={{ color: "#e4e4f0" }}>
        <h5 className="fw-bold">{name}</h5>

        <div
          className="mb-3"
          style={{
            color: "#a1a1b5",
            maxHeight: 60,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {description || "No description"}
        </div>

        <button
          onClick={handleEnter}
          className="btn w-100 fw-bold mt-auto"
          style={{
            backgroundColor: "transparent",
            border: "1px solid #5b5bd6",
            color: "#a5b4fc",
          }}
        >
          Enter Group
        </button>

        <button
          type="button"
          onClick={handleCopyId}
          className="btn w-100 fw-bold mt-2"
          style={{
            backgroundColor: "#2a2a3d",
            border: "1px solid #3a3a55",
            color: "#e4e4f0",
          }}
        >
          {copied ? "Workspace ID Copied" : "Get Workspace ID"}
        </button>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        id={`delete-${group_id}`}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}