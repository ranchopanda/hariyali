import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface FeedbackFormProps {
  analysisId: string;
  onSubmit: (isHelpful: boolean, comment?: string) => Promise<void>;
}

export const FeedbackForm = ({ analysisId, onSubmit }: FeedbackFormProps) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (isHelpful === null) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(isHelpful, comment);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-4 bg-green-50 rounded-md text-green-800">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Was this analysis helpful?</h3>
      <div className="flex gap-4 mb-4">
        <Button
          variant={isHelpful === true ? 'default' : 'outline'}
          onClick={() => setIsHelpful(true)}
        >
          Yes
        </Button>
        <Button
          variant={isHelpful === false ? 'destructive' : 'outline'}
          onClick={() => setIsHelpful(false)}
        >
          No
        </Button>
      </div>

      {isHelpful === false && (
        <div className="space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What was wrong with the analysis? (Optional)"
            className="min-h-[100px]"
          />
        </div>
      )}

      {isHelpful !== null && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-4"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      )}
    </div>
  );
};
