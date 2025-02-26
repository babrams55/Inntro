
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AccessRequest {
  id: string;
  email: string;
  university: string;
  instagram: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase.rpc('is_admin', {
        user_email: session.data.session.user.email
      });

      if (error || !data) {
        navigate('/');
        return;
      }

      setIsAdmin(data);
      if (data) {
        fetchRequests();
      }
    };

    checkAdmin();
  }, [navigate]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch access requests"
      });
      return;
    }

    setRequests(data);
    setLoading(false);
  };

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user.email) return;

    try {
      const { error } = await supabase.rpc('handle_access_request', {
        request_id: requestId,
        new_status: status,
        admin_email: session.data.session.user.email
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${status} successfully`
      });

      fetchRequests();
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process request"
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Access Requests</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{request.email}</h3>
                    <p className="text-gray-400">University: {request.university}</p>
                    <p className="text-gray-400">Instagram: {request.instagram}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleRequest(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRequest(request.id, 'rejected')}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {request.status !== 'pending' && (
                      <span className="px-3 py-1 rounded-full text-sm capitalize bg-gray-800">
                        {request.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
