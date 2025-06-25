import { Typography, Button } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <Typography variant="h6">Something went wrong</Typography>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }
    return this.props.children; 
  }
}