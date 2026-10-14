<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $recipient,
        public string $notifTitle,
        public string $notifBody,
        public ?string $actionUrl = null,
        public ?User $actor = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->notifTitle . ' - Talaghayan Portal',
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

        return new Content(
            view: 'emails.notification',
            with: [
                'recipientName' => $this->recipient->name,
                'notifTitle'    => $this->notifTitle,
                'notifBody'     => $this->notifBody,
                'actionUrl'     => $this->actionUrl ? $frontendUrl . $this->actionUrl : null,
                'actorName'     => $this->actor?->name,
            ],
        );
    }
}
