import { FormHTMLAttributes } from 'preact';

import { Button } from '~/components/Button/Button';

import './RegistrationForm.css';

interface RegistrationFormProps extends FormHTMLAttributes {}

export const RegistrationForm = ({ ...props }: RegistrationFormProps) => {
	return <form {...props}>
		<label htmlFor="email">
			Email:
			<input type="email" id="email" placeholder="E-mail" minLength={1} />
		</label>
		<label htmlFor="password">
			Password:
			<input type="password" id="password" placeholder="Password" minLength={8} />
		</label>
		<label htmlFor="password-confirmation">
			Password again:
			<input type="password" id="password-confirmation" placeholder="Password" minLength={8} />
		</label>
		<Button variant='primary' type='submit'>Register</Button>
	</form>
};
