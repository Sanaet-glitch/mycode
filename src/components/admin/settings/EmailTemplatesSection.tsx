import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, Eye, Copy, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllEmailTemplates, getEmailTemplateById, updateEmailTemplate, createEmailTemplate } from "@/services/configService";

// Email template interface
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  lastUpdated: string;
  variables: string[];
}

export default function EmailTemplatesSection() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<EmailTemplate, "id" | "lastUpdated">>({
    name: "",
    subject: "",
    body: "",
    description: "",
    variables: []
  });
  const [newVariable, setNewVariable] = useState("");
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: getAllEmailTemplates,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch single template details
  const { data: templateDetail, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['emailTemplate', selectedTemplate?.id],
    queryFn: () => selectedTemplate?.id ? getEmailTemplateById(selectedTemplate.id) : null,
    enabled: !!selectedTemplate?.id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Update template mutation
  const { mutate: saveTemplateMutation, isPending: isSaving } = useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['emailTemplate', editingTemplate?.id] });
      toast({
        title: "Template Saved",
        description: "Email template has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Create template mutation
  const { mutate: createTemplateMutation, isPending: isCreating } = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      setShowNewTemplateDialog(false);
      setNewTemplate({
        name: "",
        subject: "",
        body: "",
        description: "",
        variables: []
      });
      toast({
        title: "Template Created",
        description: "New email template has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update editing template when template detail is loaded
  useEffect(() => {
    if (templateDetail) {
      setEditingTemplate(templateDetail);
    }
  }, [templateDetail]);

  // Handle template selection
  const handleTemplateChange = (id: string) => {
    const template = templates?.find(t => t.id === id) || null;
    setSelectedTemplate(template);
  };

  // Handle template edit
  const handleTemplateEdit = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingTemplate) return;
    
    const { name, value } = e.target;
    setEditingTemplate({
      ...editingTemplate,
      [name]: value
    });
  };

  // Save template
  const saveTemplate = async () => {
    if (!editingTemplate) return;
    saveTemplateMutation(editingTemplate);
  };

  // Handle new template changes
  const handleNewTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate({
      ...newTemplate,
      [name]: value
    });
  };

  // Add variable to new template
  const addVariable = () => {
    if (!newVariable.trim()) return;
    
    if (!newTemplate.variables.includes(newVariable)) {
      setNewTemplate({
        ...newTemplate,
        variables: [...newTemplate.variables, newVariable]
      });
    }
    
    setNewVariable("");
  };

  // Remove variable from new template
  const removeVariable = (variable: string) => {
    setNewTemplate({
      ...newTemplate,
      variables: newTemplate.variables.filter(v => v !== variable)
    });
  };

  // Create new template
  const createNewTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      toast({
        title: "Validation Error",
        description: "Name, subject, and body are required fields.",
        variant: "destructive",
      });
      return;
    }
    
    createTemplateMutation(newTemplate);
  };

  // Copy template HTML to clipboard
  const copyTemplateHtml = () => {
    if (!editingTemplate) return;
    
    navigator.clipboard.writeText(editingTemplate.body);
    toast({
      title: "Copied to Clipboard",
      description: "Email template HTML has been copied.",
    });
  };

  // Show preview dialog
  const previewTemplate = () => {
    if (!editingTemplate) return;
    setPreviewHtml(getPreviewHtml());
    setShowPreview(true);
  };

  // Replace variables with sample values for preview
  const getPreviewHtml = () => {
    if (!editingTemplate) return "";
    
    let previewHtml = editingTemplate.body;
    
    // Replace variables with sample values
    editingTemplate.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      
      let sampleValue = "Sample";
      
      // Provide appropriate sample values based on variable name
      if (variable.toLowerCase().includes("email")) {
        sampleValue = "user@example.com";
      } else if (variable.toLowerCase().includes("name")) {
        sampleValue = "John Doe";
      } else if (variable.toLowerCase().includes("url")) {
        sampleValue = "https://example.com/link";
      } else if (variable.toLowerCase().includes("date")) {
        sampleValue = new Date().toLocaleDateString();
      } else if (variable.toLowerCase().includes("time")) {
        sampleValue = new Date().toLocaleTimeString();
      } else if (variable.toLowerCase().includes("year")) {
        sampleValue = new Date().getFullYear().toString();
      }
      
      previewHtml = previewHtml.replace(regex, sampleValue);
    });
    
    return previewHtml;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Manage email templates for system notifications and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-full max-w-xs">
                <Label htmlFor="templateSelect" className="mb-2 block">Select Template</Label>
                <Select 
                  value={selectedTemplate?.id || ""}
                  onValueChange={handleTemplateChange}
                  disabled={isLoadingTemplates}
                >
                  <SelectTrigger id="templateSelect">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => setShowNewTemplateDialog(true)}
                variant="outline"
                className="mt-5"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </div>
            
            {/* Template Editor */}
            {isLoadingTemplate ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : editingTemplate ? (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={editingTemplate.name}
                      onChange={handleTemplateEdit}
                      placeholder="Welcome Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={editingTemplate.description}
                      onChange={handleTemplateEdit}
                      placeholder="Sent to new users after registration"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={editingTemplate.subject}
                    onChange={handleTemplateEdit}
                    placeholder="Welcome to Campus Connect!"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body">Email Body (HTML)</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={copyTemplateHtml}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={previewTemplate}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="body"
                    name="body"
                    value={editingTemplate.body}
                    onChange={handleTemplateEdit}
                    placeholder="<html>...</html>"
                    className="font-mono text-xs h-80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate.variables.map(variable => (
                      <div 
                        key={variable}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                      >
                        {`{{${variable}}}`}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(templateDetail)}
                    disabled={JSON.stringify(editingTemplate) === JSON.stringify(templateDetail) || isSaving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={saveTemplate}
                    disabled={JSON.stringify(editingTemplate) === JSON.stringify(templateDetail) || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : selectedTemplate ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Select a template to edit or create a new one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview of how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="p-4 border rounded-md">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-[500px] border-0"
              />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPreview(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for system notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Template Name</Label>
                <Input
                  id="newName"
                  name="name"
                  value={newTemplate.name}
                  onChange={handleNewTemplateChange}
                  placeholder="Notification Email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newDescription">Description</Label>
                <Input
                  id="newDescription"
                  name="description"
                  value={newTemplate.description}
                  onChange={handleNewTemplateChange}
                  placeholder="Description of when this email is sent"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newSubject">Email Subject</Label>
              <Input
                id="newSubject"
                name="subject"
                value={newTemplate.subject}
                onChange={handleNewTemplateChange}
                placeholder="Subject Line"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newBody">Email Body (HTML)</Label>
              <Textarea
                id="newBody"
                name="body"
                value={newTemplate.body}
                onChange={handleNewTemplateChange}
                placeholder="<html>...</html>"
                className="font-mono text-xs h-40"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Template Variables</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  placeholder="Add variable (e.g. firstName)"
                  className="flex-1"
                />
                <Button type="button" onClick={addVariable} variant="secondary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newTemplate.variables.map(variable => (
                  <div 
                    key={variable}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm flex items-center"
                  >
                    {`{{${variable}}}`}
                    <button
                      type="button"
                      onClick={() => removeVariable(variable)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={createNewTemplate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                <>Create Template</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 