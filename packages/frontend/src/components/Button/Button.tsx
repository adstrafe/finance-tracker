import { ButtonHTMLAttributes } from 'preact';

import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
	size?: 'small' | 'medium' | 'large';
	fullWidth?: boolean;
	loading?: boolean;
}

export const Button = ({
	children,
	variant = 'primary',
	size = 'medium',
	fullWidth = false,
	loading = false,
	disabled,
	className = '',
	...rest
}: ButtonProps) => {
	const classes = [
		'btn',
		`btn-${variant}`,
		`btn-${size}`,
		fullWidth && 'btn-full',
		loading && 'btn-loading',
		className
	].filter(Boolean).join(' ');

	return (
		<button
			className={classes}
			disabled={disabled || loading}
			{...rest}
		>
			{loading && <span className="btn-spinner" />}
			{children}
		</button>
	);
};
