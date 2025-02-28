
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, X, User, Mail, School, Instagram, Calendar, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AccessRequest {
  id: string;
  email: string;
  university: string;
  instagram: string;
  status: string;
  created_at: string;
  approval_token: string;
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "You must be logged in as an admin to access this page."
        });
        navigate('/');
        return;
      }

      const { data, error } = await supabase.rpc('is_admin', {
        user_email: session.data.session.user.email
      });

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "You don't have permission to access this page."
        });
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
    setLoading(true);
    try {
      let query = supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filteredStatus) {
        query = query.eq('status', filteredStatus);
      }
      
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch access requests"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user.email) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to perform this action."
      });
      return;
    }

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

  const handleFilter = (status: string | null) => {
    setFilteredStatus(status);
    
    // Apply filter immediately
    setTimeout(() => {
      fetchRequests();
    }, 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <Info className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="mb-6">You need admin privileges to view this page.</p>
          <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              Access Requests
            </h1>
            <p className="text-gray-400 mt-1">Manage user access to Inntro Social</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Button 
              onClick={() => handleFilter(null)}
              variant={filteredStatus === null ? "default" : "outline"}
              className={filteredStatus === null ? "bg-gradient-to-r from-blue-500 to-purple-500" : "border-[#2A2A2A] text-white"}
              size="sm"
            >
              All
            </Button>
            <Button 
              onClick={() => handleFilter('pending')}
              variant={filteredStatus === 'pending' ? "default" : "outline"}
              className={filteredStatus === 'pending' ? "bg-yellow-500 hover:bg-yellow-600" : "border-[#2A2A2A] text-white"}
              size="sm"
            >
              Pending
            </Button>
            <Button 
              onClick={() => handleFilter('approved')}
              variant={filteredStatus === 'approved' ? "default" : "outline"}
              className={filteredStatus === 'approved' ? "bg-green-500 hover:bg-green-600" : "border-[#2A2A2A] text-white"}
              size="sm"
            >
              Approved
            </Button>
            <Button 
              onClick={() => handleFilter('rejected')}
              variant={filteredStatus === 'rejected' ? "default" : "outline"}
              className={filteredStatus === 'rejected' ? "bg-red-500 hover:bg-red-600" : "border-[#2A2A2A] text-white"}
              size="sm"
            >
              Rejected
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-purple-500 border-b-blue-500 border-l-pink-500 border-r-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading requests...</p>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-medium mb-2">No requests found</h3>
            <p className="text-gray-400">
              {filteredStatus 
                ? `No ${filteredStatus} requests at this time.` 
                : "There are no access requests at this time."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 md:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <h3 className="text-lg font-medium">{request.email}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-300">University: {request.university}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-400" />
                        <span className="text-gray-300">Instagram: {request.instagram}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Submitted: {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>ID: {request.id.slice(0, 8)}...</span>
                      </div>
                      
                      <div>{getStatusBadge(request.status)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleRequest(request.id, 'approved')}
                          className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRequest(request.id, 'rejected')}
                          variant="destructive"
                          className="flex-1 md:flex-initial"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
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
