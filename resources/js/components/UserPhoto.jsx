const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" fill="#f1f5f9"/>
  <circle cx="80" cy="58" r="27" fill="none" stroke="#94a3b8" stroke-width="7"/>
  <path d="M29 145c5-31 25-47 51-47s46 16 51 47" fill="none" stroke="#94a3b8" stroke-width="7" stroke-linecap="round"/>
</svg>
`)}`;

export default function UserPhoto({ user, className = '' }) {
    const label = user?.name ?? 'No photo';

    return (
        <img
            src={user?.photo_url || PLACEHOLDER_IMAGE}
            alt={label}
            title={label}
            onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }}
            className={className}
        />
    );
}
