import { LoginForm } from '~/components/Auth/LoginForm/LoginForm';
import { RegistrationForm } from '~/components/Auth/RegistrationForm/RegistrationForm';

import './LoginScreen.css';

export const LoginScreen = () => {
	return (
		<>
			<RegistrationForm />
			<LoginForm />
		</>
	)
};
