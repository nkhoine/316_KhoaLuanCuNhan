import { useNavigate } from 'react-router-dom';
import ProfileEditor from '../../components/user/ProfileEditor';
export default function UserOnboardingPage(){const navigate=useNavigate();return <ProfileEditor mode="onboarding" onSaved={()=>navigate('/app/dashboard',{replace:true})}/>;}
