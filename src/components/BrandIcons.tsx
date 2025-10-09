/**
 * Brand Icons - Reusable SVG icons for external services
 * Use these components to maintain consistent branding across the app
 */

interface IconProps {
  className?: string;
}

/**
 * Google Icon - Official Google "G" logo with brand colors
 */
export function GoogleIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/**
 * Ko-fi Icon - Coffee cup with heart logo
 * White cup with red/coral heart (#FF5E5B)
 */
export function KofiIcon({ className = "w-4 h-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Coffee cup body - white fill with black outline */}
      <path 
        d="M4 7C4 5.89543 4.89543 5 6 5H16C17.1046 5 18 5.89543 18 7V14C18 16.2091 16.2091 18 14 18H6C4.89543 18 4 17.1046 4 16V7Z" 
        fill="white"
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Coffee cup handle */}
      <path 
        d="M18 9H19C20.1046 9 21 9.89543 21 11C21 12.1046 20.1046 13 19 13H18" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Heart inside cup - Ko-fi red */}
      <path 
        d="M10 10.5C10 9.67157 10.6716 9 11.5 9C11.8978 9 12.2654 9.15804 12.5303 9.42296L12 10L12.4697 9.42296C12.7346 9.15804 13.1022 9 13.5 9C14.3284 9 15 9.67157 15 10.5C15 11.3284 14.3284 12 13.5 12L12 13.5L10.5 12C9.67157 12 9 11.3284 9 10.5C9 9.67157 9.67157 9 10.5 9C10.8978 9 11.2654 9.15804 11.5303 9.42296" 
        fill="#FF5E5B"
      />
      <path
        d="M9 10.5C9 9.67157 9.67157 9 10.5 9C10.8978 9 11.2654 9.15804 11.5303 9.42296L12 10L12.4697 9.42296C12.7346 9.15804 13.1022 9 13.5 9C14.3284 9 15 9.67157 15 10.5C15 12 13.5 13.5 12 14.5C10.5 13.5 9 12 9 10.5Z"
        fill="#FF5E5B"
      />
    </svg>
  );
}

/**
 * Microsoft Icon - Microsoft logo with brand colors
 */
export function MicrosoftIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="8.5" height="8.5" fill="#F25022"/>
      <rect x="12.5" y="3" width="8.5" height="8.5" fill="#7FBA00"/>
      <rect x="3" y="12.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  );
}

/**
 * GitLab Icon - GitLab logo with brand color
 */
export function GitLabIcon({ className = "w-5 h-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.42L17.0084 6.52169H6.99164L12 21.42Z" fill="#E24329"/>
      <path d="M12 21.42L6.99164 6.52169H2.28336L12 21.42Z" fill="#FC6D26"/>
      <path d="M2.28336 6.52169L1.23336 9.76836C1.11169 10.1417 1.24169 10.5517 1.56169 10.785L12 21.42L2.28336 6.52169Z" fill="#FCA326"/>
      <path d="M2.28336 6.52169H6.99164L4.89164 0.521694C4.77164 0.188361 4.26164 0.188361 4.14164 0.521694L2.28336 6.52169Z" fill="#E24329"/>
      <path d="M12 21.42L17.0084 6.52169H21.7167L12 21.42Z" fill="#FC6D26"/>
      <path d="M21.7167 6.52169L22.7667 9.76836C22.8884 10.1417 22.7584 10.5517 22.4384 10.785L12 21.42L21.7167 6.52169Z" fill="#FCA326"/>
      <path d="M21.7167 6.52169H17.0084L19.1084 0.521694C19.2284 0.188361 19.7384 0.188361 19.8584 0.521694L21.7167 6.52169Z" fill="#E24329"/>
    </svg>
  );
}
