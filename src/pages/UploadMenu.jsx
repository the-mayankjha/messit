import { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { parseExcelMenu } from '../utils/excelParser';

export default function UploadMenu({ onComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setMenuData = useStore(state => state.setMenuData);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      setError("Please upload a valid .xlsx file.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const parsedData = await parseExcelMenu(file);
      setMenuData(parsedData);
      if (onComplete) onComplete();
    } catch (err) {
      setError("Failed to parse the menu file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            Upload Your Mess Menu
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Upload your college mess menu (Excel / .xlsx format) to schedule your meals.
          </p>
        </CardHeader>
        <CardContent>
          <form 
            onDragEnter={handleDrag} 
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col items-center"
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".xlsx"
              onChange={handleChange} 
            />
            <label 
              htmlFor="file-upload" 
              className={`w-full flex-col flex items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
                dragActive ? 'border-accent bg-accent/20' : 'border-border hover:bg-muted/50'
              }`}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-center">
                Drag and drop your .xlsx file here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </label>

            {loading && (
              <div className="mt-6 flex items-center gap-2 text-accent">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                <span>Parsing menu...</span>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-center gap-2 text-red-500 bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-md">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="mt-8 text-center text-sm text-muted-foreground">
              By uploading, we extract "Breakfast", "Lunch", "Snacks", and "Dinner" for each day of the week.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
