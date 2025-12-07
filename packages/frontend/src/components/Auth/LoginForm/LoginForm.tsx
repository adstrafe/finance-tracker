import { FormHTMLAttributes } from 'preact';

import { Button } from '~/components/Button/Button';

import './LoginForm.css';

interface LoginFormProps extends FormHTMLAttributes {}

export const LoginForm = ({ ...props }: LoginFormProps) => {
	return <form {...props}>
		<label htmlFor="Email">
			E-mail:
			<input type="email" id="Email" placeholder="Email..." minLength={1} />
		</label>
		<label htmlFor="password">
			Password:
			<input type="password" id="password" placeholder="Password..." minlength={8} />
		</label>
		<Button variant='primary' type='submit'>Register</Button>
	</form>
};
