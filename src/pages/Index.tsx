
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";

const ADMIN_CODE = "ADMIN123"; // This is the special code for admin access

export default function Index() {
  const [code, setCode] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchPendingRequests = async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
      return;
    }

    setPendingRequests(data || []);
  };

  const handleRequestApproval = async (request: any, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ 
          status: approved ? 'approved' : 'rejected' 
        })
        .eq('id', request.id);

      if (error) throw error;

      if (approved) {
        // Generate referral code for approved request
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error: codeError } = await supabase
          .from('referral_codes')
          .insert({
            code,
            email_to: request.email,
            created_by_email: 'support@inntro.us'
          });

        if (codeError) throw codeError;
      }

      toast({
        title: approved ? "Request Approved" : "Request Rejected",
        description: `${request.email} has been ${approved ? 'approved' : 'rejected'}`
      });

      fetchPendingRequests();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const handleAccessRequest = async () => {
    if (!email || !instagram || !university) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    setLoading(true);

    try {
      const { error: functionError } = await supabase.functions.invoke('handle-access', {
        body: {
          email,
          instagram,
          university
        }
      });

      if (functionError) throw functionError;
      
      toast({
        title: "Request Sent Successfully",
        description: "We'll review your request and get back to you soon!"
      });
      
      setShowRequestForm(false);
      setEmail("");
      setInstagram("");
      setUniversity("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Submitting Request",
        description: error.message || "Failed to submit request. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an access code"
      });
      return;
    }

    setLoading(true);
    try {
      // Check if it's the admin code
      if (code === ADMIN_CODE) {
        setIsAdmin(true);
        await fetchPendingRequests();
        toast({
          title: "Admin Access Granted",
          description: "Welcome, admin!"
        });
        return;
      }

      // If not admin code, check for regular access code
      const { data, error } = await supabase
        .from('referral_codes')
        .select()
        .eq('code', code.toUpperCase())
        .eq('used', false)
        .single();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "Please check your code and try again"
        });
        return;
      }

      await supabase
        .from('referral_codes')
        .update({ used: true })
        .eq('id', data.id);

      navigate("/city-selection");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-blue-500">Inntro Social</h1>
          <p className="text-pink-400">&quot;double dates&quot;</p>
        </div>

        {isAdmin ? (
          <>
            <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold">Pending Requests ({pendingRequests.length})</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setIsAdmin(false)}
                >
                  Exit Admin
                </Button>
              </div>
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded">
                  <div className="text-sm text-white">
                    <div>{request.email}</div>
                    <div className="text-gray-400">{request.instagram} - {request.university}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                      onClick={() => handleRequestApproval(request, true)}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => handleRequestApproval(request, false)}
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              {pendingRequests.length === 0 && (
                <p className="text-gray-400 text-center">No pending requests</p>
              )}
            </div>
          </>
        ) : (
          !showRequestForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter access code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg rounded-2xl bg-gray-900 text-white placeholder:text-white/70"
                />
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={loading || !code}
                >
                  {loading ? "Checking..." : "Continue"}
                </Button>
              </div>
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowRequestForm(true)}
                >
                  Request Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-gray-900 text-white placeholder:text-white/70"
              />
              <Input
                type="text"
                placeholder="Instagram handle"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                className="bg-gray-900 text-white placeholder:text-white/70"
              />
              <Input
                type="text"
                placeholder="University"
                value={university}
                onChange={e => setUniversity(e.target.value)}
                className="bg-gray-900 text-white placeholder:text-white/70"
              />
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleAccessRequest}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Submit Request"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                  onClick={() => {
                    setShowRequestForm(false);
                    setEmail("");
                    setInstagram("");
                    setUniversity("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
