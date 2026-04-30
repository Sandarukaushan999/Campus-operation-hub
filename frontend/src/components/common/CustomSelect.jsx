import React, { useEffect, useRef, useState } from "react";

const CustomSelect = ({
  id,
  value,
  onChange,
  options = [],
  disabled = false,
  className = "",
  style = {},
  placeholder = "Select an option..."
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      <button
        id={id}
        type="button"
        className={className}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          width: '100%',
          textAlign: 'left',
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px top 50%',
          backgroundSize: '10px auto',
          cursor: disabled ? 'not-allowed' : 'pointer',
          paddingRight: '32px',
        }}
      >
        {selectedOption ? selectedOption.label : placeholder}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '6px',
          background: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          zIndex: 1200,
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          width: '100%',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {options.filter(o => !o.hidden).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: value === opt.value ? '#f1f5f9' : 'transparent',
                padding: '10px 14px',
                borderRadius: '6px',
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                opacity: opt.disabled ? 0.5 : 1,
                fontSize: '14px',
                color: value === opt.value ? '#0f172a' : '#334155',
                fontWeight: value === opt.value ? '600' : '500',
              }}
              onMouseEnter={(e) => {
                if (!opt.disabled && value !== opt.value) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!opt.disabled) e.currentTarget.style.background = value === opt.value ? '#f1f5f9' : 'transparent';
              }}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
            >
              {opt.label}
            </button>
          ))}
          {options.filter(o => !o.hidden).length === 0 && (
             <div style={{ padding: '10px 14px', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
               No options available
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
