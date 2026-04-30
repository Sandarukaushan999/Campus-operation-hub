import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, changePassword } from "../../../api/userApi";
import useAuth from "../../../hooks/useAuth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit profile form state
  const [editForm, setEditForm] = useState({ 
    fullName: "", 
    phone: "",
    profileImageUrl: "",
    notificationPreferences: {
      BOOKING: true,
      TICKET: true,
      GENERAL: true,
    }
  });
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Change password form state
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwOld, setShowPwOld] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropSource, setCropSource] = useState("");
  const [cropZoom, setCropZoom] = useState(1.2);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionType: "",
    confirmLabel: "Yes",
  });

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setEditForm({ 
          fullName: data.fullName ?? "", 
          phone: data.phone ?? "",
          profileImageUrl: data.profileImageUrl ?? "",
          notificationPreferences: {
            BOOKING: data.notificationPreferences?.BOOKING ?? true,
            TICKET: data.notificationPreferences?.TICKET ?? true,
            GENERAL: data.notificationPreferences?.GENERAL ?? true,
          }
        });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const performEditSubmit = async () => {
    setEditError("");
    setEditSuccess("");
    setEditLoading(true);
    try {
      const updated = await updateProfile(editForm);
      setProfile((prev) => ({ ...prev, ...updated }));
      setEditSuccess("Profile updated successfully.");
      setTimeout(() => setEditSuccess(""), 4000);
    } catch (err) {
      const msg =
        err?.response?.data?.details?.[0] ||
        err?.response?.data?.message ||
        "Failed to update profile.";
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: "Save changes?",
      message: "This will update your profile information and preferences.",
      actionType: "save_profile",
      confirmLabel: "Yes, Save",
    });
  };

  const performPwSubmit = async () => {
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    try {
      await changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      setPwSuccess("Password changed successfully.");
      setTimeout(() => setPwSuccess(""), 4000);
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.details?.[0] ||
        err?.response?.data?.message ||
        "Failed to change password.";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  };

  const handlePwSubmit = (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: "Update password?",
      message: "You will need to use your new password from next login.",
      actionType: "update_password",
      confirmLabel: "Yes, Update",
    });
  };

  const handleLogoutClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Logout now?",
      message: "Your unsaved changes will be lost if you continue.",
      actionType: "logout",
      confirmLabel: "Yes, Logout",
    });
  };

  const handleConfirmAction = async () => {
    const actionType = confirmModal.actionType;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    if (actionType === "save_profile") {
      await performEditSubmit();
      return;
    }
    if (actionType === "update_password") {
      await performPwSubmit();
      return;
    }
    if (actionType === "logout") {
      logout();
      navigate("/login");
    }
  };

  const handleProfileImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type?.startsWith("image/");
    if (!isImage) {
      setEditError("Please select a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setEditError("Profile image must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === "string" ? reader.result : "";
      setCropSource(imageUrl);
      setCropZoom(1.2);
      setCropOffsetX(0);
      setCropOffsetY(0);
      setCropModalOpen(true);
      setEditError("");
    };
    reader.onerror = () => setEditError("Failed to read image file.");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleApplyCrop = () => {
    if (!cropSource) return;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const outputSize = 512;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const minSide = Math.min(image.width, image.height);
      const sourceSize = minSide / cropZoom;
      const maxOffsetX = (image.width - sourceSize) / 2;
      const maxOffsetY = (image.height - sourceSize) / 2;

      const sourceX = Math.max(
        0,
        Math.min(
          image.width - sourceSize,
          (image.width - sourceSize) / 2 + (cropOffsetX / 100) * maxOffsetX,
        ),
      );
      const sourceY = Math.max(
        0,
        Math.min(
          image.height - sourceSize,
          (image.height - sourceSize) / 2 + (cropOffsetY / 100) * maxOffsetY,
        ),
      );

      ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize);
      const croppedData = canvas.toDataURL("image/jpeg", 0.92);
      setEditForm((prev) => ({ ...prev, profileImageUrl: croppedData }));
      setProfile((prev) => (prev ? { ...prev, profileImageUrl: croppedData } : prev));
      setCropModalOpen(false);
      setCropSource("");
    };
    image.onerror = () => setEditError("Failed to process image.");
    image.src = cropSource;
  };

  const handleDeleteProfileImage = () => {
    setEditForm((prev) => ({ ...prev, profileImageUrl: "" }));
    setProfile((prev) => (prev ? { ...prev, profileImageUrl: "" } : prev));
    setEditSuccess("Profile picture removed. Click Save Changes to apply.");
    setTimeout(() => setEditSuccess(""), 3000);
  };

  if (loading) return <div className="page-shell"><p>Loading profile…</p></div>;
  if (error)   return <div className="page-shell"><div className="alert alert-error">{error}</div></div>;

  const getInitial = () => {
    if (profile?.fullName && profile.fullName.trim()) return profile.fullName.trim().charAt(0).toUpperCase();
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return "U";
  };
  const initial = getInitial();
  
  // Basic check for Google linked account. Adjust depending on actual backend response.
  const isGoogleLinked = profile?.googleId || profile?.email?.endsWith("@gmail.com");

  return (
    <div className="modern-profile-page" style={{ 
      minHeight: "100vh", 
      backgroundColor: "#F8FAFC", 
      padding: "60px 24px",
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Floating Toast Notification */}
      {(editSuccess || pwSuccess) && (
        <div className="modern-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {editSuccess || pwSuccess}
        </div>
      )}

      <style>{`
        .modern-page-header {
          max-width: 1400px;
          margin: 0 auto 32px auto;
          padding: 0;
        }
        .modern-page-header h1 {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .modern-page-header p {
          font-size: 16px;
          color: #64748B;
          margin: 0;
        }

        .modern-profile-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 280px;
          gap: 32px;
          align-items: flex-start;
          animation: fade-in 0.4s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modern-card {
          background-color: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
          margin-bottom: 32px;
          border: 1px solid #E2E8F0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .modern-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px -5px rgba(0, 0, 0, 0.05), 0 4px 8px -2px rgba(0, 0, 0, 0.03);
        }

        /* Toast Notification */
        .modern-toast {
          position: fixed;
          top: 80px;
          right: 24px;
          background: #FFFFFF;
          border-left: 4px solid #22C55E;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 10px -2px rgba(0,0,0,0.05);
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          animation: slide-in-toast 0.4s cubic-bezier(0.16, 1, 0.3, 1), fade-out-toast 0.4s ease 3.6s forwards;
          color: #0F172A;
          font-weight: 600;
          font-size: 14px;
        }
        @keyframes slide-in-toast {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-out-toast {
          from { opacity: 1; }
          to { opacity: 0; pointer-events: none; }
        }
        
        /* Side Card Styles */
        .modern-side-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .modern-avatar {
          position: relative;
          width: 108px;
          height: 108px;
          margin-bottom: 20px;
        }
        .modern-avatar-circle {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E3A8A, #2563EB);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(37,99,235,0.25);
          overflow: hidden;
          border: 1px solid #bfdbfe;
        }
        .modern-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .modern-avatar-edit {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: #eff6ff;
          border: 2px solid #2563EB;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1D4ED8;
          z-index: 4;
          box-shadow: 0 8px 18px rgba(29,78,216,0.28);
          transition: all 0.2s ease;
        }
        .modern-avatar-edit:hover {
          color: #1E40AF;
          border-color: #1D4ED8;
          background: #dbeafe;
          transform: scale(1.05);
        }
        .modern-avatar-actions {
          display: flex;
          gap: 8px;
          margin-top: -6px;
          margin-bottom: 10px;
          align-items: center;
        }
        .modern-avatar-btn {
          height: 32px;
          border-radius: 999px;
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 650;
          padding: 0 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .modern-avatar-btn.icon-only { width: 36px; padding: 0; border-radius: 10px; }
        .modern-avatar-btn.danger {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }
        .modern-avatar-btn.danger.icon-only {
          width: 42px;
          border-radius: 10px;
          padding: 0;
        }
        .modern-avatar-btn:hover {
          filter: brightness(0.97);
        }
        .modern-user-name {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .modern-user-email {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 16px 0;
        }
        .modern-role-badge {
          background: #EFF6FF;
          color: #1D4ED8;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .modern-google-status {
          width: 100%;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
          text-align: left;
        }
        .modern-google-status h4 {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748B;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin: 0 0 12px 0;
        }
        .google-account-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          background: #F8FAFC;
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }
        a.google-account-card:hover {
          border-color: #3B82F6;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
          cursor: pointer;
        }
        .google-account-icon {
          width: 32px;
          height: 32px;
          background: #ffffff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .google-account-icon svg {
          width: 18px;
          height: 18px;
        }
        
        /* Main Content Styles */
        .modern-section {
          padding: 32px;
        }
        .modern-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 24px 0;
          letter-spacing: -0.01em;
        }
        .modern-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .modern-form-group {
          margin-bottom: 24px;
        }
        .modern-label {
          display: block;
          font-size: 12px;
          font-weight: 650;
          color: #475569;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .modern-input {
          width: 100%;
          height: 44px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          padding: 0 16px;
          font-size: 14px;
          color: #0F172A;
          background-color: #F8FAFC;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
        }
        .modern-input:focus {
          outline: none;
          background-color: #ffffff;
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .modern-input:read-only {
          background-color: #F1F5F9;
          color: #94A3B8;
          border-color: #E2E8F0;
          cursor: not-allowed;
        }
        .modern-btn-primary {
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #ffffff;
          height: 44px;
          padding: 0 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px 0 rgba(37,99,235,0.25);
        }
        .modern-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.35);
        }
        .modern-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .modern-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          background: #94A3B8;
          box-shadow: none;
        }
        .modern-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
        }
        .modern-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid #F1F5F9;
        }
        .modern-toggle-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .modern-toggle-row:first-child {
          padding-top: 0;
        }
        .modern-toggle-label {
          font-size: 14px;
          color: #334155;
          font-weight: 600;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #CBD5E1;
          transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-switch input:checked + .toggle-slider {
          background-color: #2563EB;
        }
        .toggle-switch input:focus-visible + .toggle-slider {
          box-shadow: 0 0 0 2px white, 0 0 0 4px rgba(37,99,235,0.3);
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        .modern-alert {
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modern-alert-error {
          background-color: #FEF2F2;
          color: #991B1B;
          border: 1px solid #FCA5A5;
        }
        .modern-alert-success {
          background-color: #F0FDF4;
          color: #166534;
          border: 1px solid #86EFAC;
        }
        .modern-alert svg {
          flex-shrink: 0;
        }
        .modern-confirm-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          animation: fade-in 0.2s ease-out;
        }
        .modern-confirm-modal {
          width: min(92vw, 420px);
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #DBEAFE;
          box-shadow: 0 20px 40px -8px rgba(30, 64, 175, 0.25);
          padding: 24px;
        }
        .modern-confirm-modal h4 {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
        }
        .modern-confirm-modal p {
          margin: 0;
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
        }
        .modern-confirm-actions {
          margin-top: 22px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .modern-btn-secondary {
          background: #ffffff;
          color: #334155;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          height: 40px;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modern-btn-secondary:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }
        .modern-crop-preview {
          width: min(72vw, 320px);
          height: min(72vw, 320px);
          margin: 16px auto 0;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #bfdbfe;
          background: #e2e8f0;
          position: relative;
        }
        .modern-crop-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform-origin: center center;
        }
        .modern-crop-controls {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }
        .modern-crop-controls label {
          font-size: 12px;
          color: #475569;
          font-weight: 600;
          display: grid;
          gap: 6px;
        }
        .modern-crop-controls input[type="range"] {
          width: 100%;
          accent-color: #2563EB;
        }
        .modern-profile-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 280px;
          gap: 32px;
          align-items: flex-start;
          animation: fade-in 0.4s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) {
          .modern-profile-layout {
            grid-template-columns: 280px 1fr;
          }
        }
        @media (max-width: 768px) {
          .modern-profile-layout {
            grid-template-columns: 1fr;
          }
          .modern-form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
        @media (max-width: 640px) {
          .modern-section {
            padding: 24px;
          }
          .modern-actions {
            flex-direction: column;
          }
          .modern-btn-primary {
            width: 100%;
          }
        }
      `}</style>

      <div className="modern-page-header">
        <h1>Account Settings</h1>
        <p>Manage your profile, security, and preferences</p>
      </div>

      <div className="modern-profile-layout">
        
        {/* Left Sidebar */}
        <aside className="modern-left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Profile Card */}
          <div className="modern-card modern-side-card" style={{ marginBottom: 0 }}>
          <div className="modern-avatar">
            <div className="modern-avatar-circle">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Profile" />
              ) : (
                initial
              )}
              <button
                type="button"
                className="modern-avatar-edit"
                title="Change Photo"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleProfileImageSelect}
            />
          </div>
          <div className="modern-avatar-actions">
            <button
              className="modern-avatar-btn icon-only"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile picture"
              aria-label="Change profile picture"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
            <button
              className="modern-avatar-btn danger icon-only"
              type="button"
              onClick={handleDeleteProfileImage}
              title="Delete profile picture"
              aria-label="Delete profile picture"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
              </svg>
            </button>
          </div>
          
          <h2 className="modern-user-name">{profile.fullName}</h2>
          <p className="modern-user-email">{profile.email}</p>
          <span className="modern-role-badge">{profile.role}</span>

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px' }}>
              <span>Member since</span>
              <span style={{ fontWeight: 600, color: '#475569' }}>Jan 2024</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px' }}>
              <span>Last active</span>
              <span style={{ fontWeight: 600, color: '#475569' }}>Just now</span>
            </div>
          </div>

          <div className="modern-google-status">
            <h4>Connected Accounts</h4>
            {isGoogleLinked ? (
              <div className="google-account-card">
                <div className="google-account-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Google</div>
                  <div style={{ fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }}></span>
                    Connected
                  </div>
                </div>
              </div>
            ) : (
              <a href="http://localhost:8080/oauth2/authorization/google" className="google-account-card" title="Click to link your Google account">
                <div className="google-account-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Google</div>
                  <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CBD5E1' }}></span>
                    Click to connect
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </a>
            )}
          </div>
        </div>
          {/* Login Activity Card */}
          <div className="modern-card" style={{ marginBottom: 0 }}>
            <div className="modern-section" style={{ padding: '32px 24px' }}>
              <h3 className="modern-section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Login Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                           <line x1="8" y1="21" x2="16" y2="21"></line>
                           <line x1="12" y1="17" x2="12" y2="21"></line>
                         </svg>
                       </div>
                       <div>
                         <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>Mac OS • Chrome</div>
                         <div style={{ fontSize: '11px', color: '#64748B' }}>Colombo, Sri Lanka</div>
                       </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#22C55E', fontWeight: 600, background: '#DCFCE7', padding: '2px 8px', borderRadius: '999px', marginTop: '2px' }}>Active</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', marginLeft: '48px' }}>IP: 192.168.1.1</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                           <rect x="9" y="9" width="6" height="6"></rect>
                           <line x1="9" y1="1" x2="9" y2="4"></line>
                           <line x1="15" y1="1" x2="15" y2="4"></line>
                           <line x1="9" y1="20" x2="9" y2="23"></line>
                           <line x1="15" y1="20" x2="15" y2="23"></line>
                           <line x1="20" y1="9" x2="23" y2="9"></line>
                           <line x1="20" y1="14" x2="23" y2="14"></line>
                           <line x1="1" y1="9" x2="4" y2="9"></line>
                           <line x1="1" y1="14" x2="4" y2="14"></line>
                         </svg>
                       </div>
                       <div>
                         <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '2px' }}>Windows 11 • Edge</div>
                         <div style={{ fontSize: '11px', color: '#64748B' }}>Kandy, Sri Lanka</div>
                       </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>2 days ago</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', marginLeft: '48px' }}>IP: 192.168.1.2</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Content */}
        <main className="modern-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
          
          {/* Personal Information */}
          <div className="modern-card" style={{ marginBottom: 0 }}>
            <div className="modern-section">
              <h3 className="modern-section-title">Personal Information</h3>
              
              {editError && (
                <div className="modern-alert modern-alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {editError}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit}>
                <div className="modern-form-row">
                  <div className="modern-form-group">
                    <label className="modern-label" htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      className="modern-input"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="modern-form-group">
                    <label className="modern-label" htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      className="modern-input"
                      type="tel"
                      placeholder="e.g. +94 77 123 4567"
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="modern-form-group">
                  <label className="modern-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    className="modern-input"
                    value={profile.email}
                    readOnly
                    title="Email cannot be changed"
                  />
                </div>

                <div className="modern-actions">
                  <button className="modern-btn-primary" type="submit" disabled={editLoading}>
                    {editLoading ? "Saving Changes…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Settings */}
          <div className="modern-card" style={{ marginBottom: 0 }}>
            <div className="modern-section">
              <h3 className="modern-section-title">Security Settings</h3>
              
              {pwError && (
                <div className="modern-alert modern-alert-error">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  {pwError}
                </div>
              )}
              
              <form onSubmit={handlePwSubmit}>
                <div className="modern-form-group">
                  <label className="modern-label" htmlFor="pw-old">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="pw-old"
                      className="modern-input"
                      type={showPwOld ? "text" : "password"}
                      value={pwForm.oldPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, oldPassword: e.target.value }))}
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPwOld(!showPwOld)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPwOld ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="modern-form-group">
                  <label className="modern-label" htmlFor="pw-new">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="pw-new"
                      className="modern-input"
                      type={showPwNew ? "text" : "password"}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                      required
                      minLength={8}
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPwNew(!showPwNew)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPwNew ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Must be at least 8 characters.</div>
                </div>

                <div className="modern-form-group">
                  <label className="modern-label" htmlFor="pw-confirm">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="pw-confirm"
                      className="modern-input"
                      type={showPwConfirm ? "text" : "password"}
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      required
                      minLength={8}
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPwConfirm ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="modern-actions">
                  <button className="modern-btn-primary" type="submit" disabled={pwLoading}>
                    {pwLoading ? "Updating Password…" : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="modern-right-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Notifications Card */}
          <div className="modern-card modern-side-card" style={{ padding: '32px 24px', marginBottom: 0 }}>
            <h3 className="modern-section-title" style={{ fontSize: '18px', textAlign: 'left', width: '100%', marginBottom: '24px' }}>Notification Preferences</h3>
            
            <form onSubmit={handleEditSubmit} style={{ width: '100%' }}>
              <div className="modern-toggle-row" style={{ padding: '16px 0', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="modern-toggle-label" style={{ fontSize: '14px', textAlign: 'left' }}>Receive Booking Updates</span>
                  <span style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>Get notified when your booking status is approved or rejected.</span>
                </div>
                <label className="toggle-switch" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.notificationPreferences.BOOKING}
                    onChange={(e) => setEditForm(p => ({ ...p, notificationPreferences: { ...p.notificationPreferences, BOOKING: e.target.checked } }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="modern-toggle-row" style={{ padding: '16px 0', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="modern-toggle-label" style={{ fontSize: '14px', textAlign: 'left' }}>Receive Ticket Updates</span>
                  <span style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>Receive alerts when tickets are assigned or resolved.</span>
                </div>
                <label className="toggle-switch" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.notificationPreferences.TICKET}
                    onChange={(e) => setEditForm(p => ({ ...p, notificationPreferences: { ...p.notificationPreferences, TICKET: e.target.checked } }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="modern-toggle-row" style={{ padding: '16px 0', borderBottom: 'none', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="modern-toggle-label" style={{ fontSize: '14px', textAlign: 'left' }}>General & Resource Updates</span>
                  <span style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>Stay updated on new campus resources and announcements.</span>
                </div>
                <label className="toggle-switch" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <input 
                    type="checkbox" 
                    checked={editForm.notificationPreferences.GENERAL}
                    onChange={(e) => setEditForm(p => ({ ...p, notificationPreferences: { ...p.notificationPreferences, GENERAL: e.target.checked } }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="modern-actions" style={{ marginTop: '24px', paddingTop: '24px' }}>
                <button className="modern-btn-primary" type="submit" disabled={editLoading} style={{ width: '100%', height: '44px', fontSize: '14px' }}>
                  {editLoading ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>

          {/* Account Actions Card */}
          <div className="modern-card modern-side-card" style={{ padding: '32px 24px', marginBottom: 0 }}>
            <h3 className="modern-section-title" style={{ fontSize: '18px', textAlign: 'left', width: '100%', marginBottom: '24px' }}>Manage Account</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <button type="button" onClick={handleLogoutClick} style={{ width: '100%', padding: '12px', background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center' }}>
                Logout Account
              </button>
              
              <button type="button" onClick={() => {}} style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center' }}>
                Deactivate Account
              </button>
            </div>
          </div>

        </aside>

      </div>

      {confirmModal.isOpen && (
        <div className="modern-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="modern-confirm-modal">
            <h4>{confirmModal.title}</h4>
            <p>{confirmModal.message}</p>
            <div className="modern-confirm-actions">
              <button
                type="button"
                className="modern-btn-secondary"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button type="button" className="modern-btn-primary" onClick={handleConfirmAction}>
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {cropModalOpen && (
        <div className="modern-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="modern-confirm-modal">
            <h4>Crop profile picture</h4>
            <p>Adjust zoom and position, then apply your crop.</p>
            <div className="modern-crop-preview">
              <img
                src={cropSource}
                alt="Crop preview"
                style={{ transform: `translate(${cropOffsetX}px, ${cropOffsetY}px) scale(${cropZoom})` }}
              />
            </div>
            <div className="modern-crop-controls">
              <label>
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                />
              </label>
              <label>
                Move Left / Right
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropOffsetX}
                  onChange={(e) => setCropOffsetX(Number(e.target.value))}
                />
              </label>
              <label>
                Move Up / Down
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropOffsetY}
                  onChange={(e) => setCropOffsetY(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="modern-confirm-actions">
              <button
                type="button"
                className="modern-btn-secondary"
                onClick={() => {
                  setCropModalOpen(false);
                  setCropSource("");
                }}
              >
                Cancel
              </button>
              <button type="button" className="modern-btn-primary" onClick={handleApplyCrop}>
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
